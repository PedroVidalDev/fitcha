import AsyncStorage from '@react-native-async-storage/async-storage'
import { isAxiosError } from 'axios'
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react'
import {
    ApiUser,
    AuthContextValue,
    AuthResponse,
    ChangePasswordInput,
    LegacyStoredAuthSession,
    PasswordResetRequestResponse,
    RegisterResponse,
    StoredAuthSession,
    User,
} from '../../@types/auth'
import {
    axiosApp,
    ensureApiUrlConfigured,
    setAxiosAuthSessionExpiredHandler,
    setAxiosAuthToken,
} from '../../services/axios'
import { clearScheduledNotifications } from '../../services/notifications'
import { clearData } from '../../services/storage'
import { resetWorkoutSyncState } from '../../services/workoutData'

const AUTH_KEY = 'auth_session'
const LEGACY_AUTH_KEY = 'auth_user'
const ALWAYS_LOGGED_IN_FOR_TESTS = false
const SERVICE_UNAVAILABLE_MESSAGE =
    'O servico pode estar indisponivel no momento. Tente novamente em instantes.'
const SERVICE_UNAVAILABLE_CODE = 'AUTH_SERVICE_UNAVAILABLE'
const BASE64_ALPHABET =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

type AuthErrorKind = 'service_unavailable' | 'validation'
type ApiErrorResponse = {
    error?: string
    code?: string
}
type SessionTokenStatus = 'valid' | 'expired' | 'invalid'

const TEST_USER: User = {
    id: 0,
    name: 'Usuario Teste',
    email: 'teste@fitcha.app',
    credits: 3,
    verified: true,
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    isLoading: true,
    isSessionExpiredNoticeVisible: false,
    login: async () => {},
    register: async () => ({ message: '', email: '' }),
    requestPasswordReset: async () => ({ message: '' }),
    dismissSessionExpiredNotice: () => {},
    logout: async () => {},
    changePassword: async () => {},
    setCredits: async () => {},
})

export class AuthRequestError extends Error {
    kind: AuthErrorKind
    code: string | null

    constructor(message: string, kind: AuthErrorKind, code?: string | null) {
        super(message)
        this.name = 'AuthRequestError'
        this.kind = kind
        this.code = code ?? null
        Object.setPrototypeOf(this, AuthRequestError.prototype)
    }
}

function normalizeUser(user: ApiUser): User {
    return {
        id: user.ID,
        createdAt: user.CreatedAt,
        updatedAt: user.UpdatedAt,
        credits: typeof user.credits === 'number' ? user.credits : 0,
        verified: user.verified !== false,
        name: user.name,
        email: user.email,
    }
}

function buildSession(token: string, user: User): StoredAuthSession {
    return {
        token,
        user,
    }
}

function buildTestSession() {
    return buildSession('test-session-token', TEST_USER)
}

function parseStoredSession(raw: string): StoredAuthSession | null {
    try {
        const parsed = JSON.parse(
            raw,
        ) as Partial<LegacyStoredAuthSession> | null

        if (
            !parsed ||
            typeof parsed !== 'object' ||
            typeof parsed.token !== 'string' ||
            !parsed.user ||
            typeof parsed.user !== 'object' ||
            typeof parsed.user.email !== 'string' ||
            typeof parsed.user.name !== 'string'
        ) {
            return null
        }

        return buildSession(parsed.token, {
            id: parsed.user.id,
            createdAt: parsed.user.createdAt,
            updatedAt: parsed.user.updatedAt,
            credits:
                typeof (parsed.user as User).credits === 'number'
                    ? (parsed.user as User).credits
                    : 0,
            verified:
                typeof (parsed.user as User).verified === 'boolean'
                    ? (parsed.user as User).verified
                    : true,
            name: parsed.user.name,
            email: parsed.user.email,
        })
    } catch {
        return null
    }
}

function storedSessionNeedsRewrite(raw: string) {
    try {
        const parsed = JSON.parse(raw) as { profile?: unknown } | null
        return !!parsed && typeof parsed === 'object' && 'profile' in parsed
    } catch {
        return false
    }
}

function decodeBase64Latin1(value: string) {
    let buffer = 0
    let bits = 0
    let decoded = ''

    for (const char of value.replace(/=+$/g, '')) {
        const index = BASE64_ALPHABET.indexOf(char)
        if (index < 0) {
            return null
        }

        buffer = (buffer << 6) | index
        bits += 6

        if (bits >= 8) {
            bits -= 8
            decoded += String.fromCharCode((buffer >> bits) & 0xff)
        }
    }

    return decoded
}

function getSessionTokenStatus(token: string): SessionTokenStatus {
    const parts = token.split('.')
    if (parts.length !== 3) {
        return 'invalid'
    }

    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const remainder = payload.length % 4
    const paddedPayload =
        payload + (remainder === 0 ? '' : '='.repeat(4 - remainder))
    const decodedPayload = decodeBase64Latin1(paddedPayload)

    if (!decodedPayload) {
        return 'invalid'
    }

    try {
        const parsed = JSON.parse(decodedPayload) as {
            exp?: number | string
        } | null
        if (!parsed || typeof parsed !== 'object') {
            return 'invalid'
        }

        const expSeconds =
            typeof parsed.exp === 'number'
                ? parsed.exp
                : typeof parsed.exp === 'string'
                  ? Number(parsed.exp)
                  : Number.NaN

        if (!Number.isFinite(expSeconds)) {
            return 'invalid'
        }

        return expSeconds * 1000 <= Date.now() ? 'expired' : 'valid'
    } catch {
        return 'invalid'
    }
}

function getApiErrorResponse(error: unknown): ApiErrorResponse | null {
    if (!isAxiosError(error)) return null

    const responseData = error.response?.data
    if (!responseData || typeof responseData !== 'object') return null

    return responseData as ApiErrorResponse
}

function getAuthErrorCode(error: unknown) {
    const responseData = getApiErrorResponse(error)
    if (typeof responseData?.code === 'string' && responseData.code.trim()) {
        return responseData.code
    }

    return null
}

function getAuthErrorMessage(error: unknown, fallback: string) {
    if (isAxiosError(error)) {
        const responseData = error.response?.data

        if (typeof responseData === 'string' && responseData.trim()) {
            return responseData
        }

        if (
            responseData &&
            typeof responseData === 'object' &&
            'error' in responseData &&
            typeof responseData.error === 'string' &&
            responseData.error.trim()
        ) {
            return responseData.error
        }
    }

    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return fallback
}

function isServiceUnavailableError(error: unknown) {
    if (isAxiosError(error)) {
        const status = error.response?.status

        return !status || status === 404 || status >= 500
    }

    if (error instanceof Error) {
        return (
            error.message ===
            'Configure EXPO_PUBLIC_API_URL no arquivo frontend/.env'
        )
    }

    return false
}

function buildAuthRequestError(error: unknown, fallback: string) {
    if (error instanceof AuthRequestError) {
        return error
    }

    if (isServiceUnavailableError(error)) {
        return new AuthRequestError(
            SERVICE_UNAVAILABLE_MESSAGE,
            'service_unavailable',
            SERVICE_UNAVAILABLE_CODE,
        )
    }

    return new AuthRequestError(
        getAuthErrorMessage(error, fallback),
        'validation',
        getAuthErrorCode(error),
    )
}

export function isServiceUnavailableAuthError(error: unknown) {
    return (
        error instanceof AuthRequestError &&
        error.kind === 'service_unavailable'
    )
}

export function getAuthRequestErrorCode(error: unknown) {
    return error instanceof AuthRequestError ? error.code : null
}

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<StoredAuthSession | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSessionExpiredNoticeVisible, setIsSessionExpiredNoticeVisible] =
        useState(false)

    const persistSession = useCallback(
        async (nextSession: StoredAuthSession) => {
            resetWorkoutSyncState()
            setAxiosAuthToken(nextSession.token)
            await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(nextSession))
            await AsyncStorage.removeItem(LEGACY_AUTH_KEY)
            setIsSessionExpiredNoticeVisible(false)
            setSession(nextSession)
        },
        [],
    )

    const clearSession = useCallback(async () => {
        await Promise.all([clearData(), clearScheduledNotifications()])
        resetWorkoutSyncState()
        setAxiosAuthToken(null)
        await AsyncStorage.multiRemove([AUTH_KEY, LEGACY_AUTH_KEY])
        setSession(null)
    }, [])

    useEffect(() => {
        const restoreSession = async () => {
            try {
                if (ALWAYS_LOGGED_IN_FOR_TESTS) {
                    await persistSession(buildTestSession())
                    return
                }

                const raw = await AsyncStorage.getItem(AUTH_KEY)

                if (!raw) {
                    await AsyncStorage.removeItem(LEGACY_AUTH_KEY)
                    return
                }

                const storedSession = parseStoredSession(raw)

                if (!storedSession) {
                    await AsyncStorage.multiRemove([AUTH_KEY, LEGACY_AUTH_KEY])
                    return
                }

                const tokenStatus = getSessionTokenStatus(storedSession.token)
                if (tokenStatus !== 'valid') {
                    await clearSession()

                    if (tokenStatus === 'expired') {
                        setIsSessionExpiredNoticeVisible(true)
                    }

                    return
                }

                setAxiosAuthToken(storedSession.token)
                if (storedSessionNeedsRewrite(raw)) {
                    await AsyncStorage.setItem(
                        AUTH_KEY,
                        JSON.stringify(storedSession),
                    )
                }
                setSession(storedSession)
            } finally {
                setIsLoading(false)
            }
        }

        void restoreSession()
    }, [clearSession, persistSession])

    const login = useCallback(
        async (email: string, password: string) => {
            try {
                ensureApiUrlConfigured()

                const response = await axiosApp.post<AuthResponse>('/login', {
                    email,
                    password,
                })

                await persistSession(
                    buildSession(
                        response.data.token,
                        normalizeUser(response.data.user),
                    ),
                )
            } catch (error) {
                throw buildAuthRequestError(error, 'Nao foi possivel entrar')
            }
        },
        [persistSession],
    )

    const register = useCallback(
        async (name: string, email: string, password: string) => {
            try {
                ensureApiUrlConfigured()

                const response = await axiosApp.post<RegisterResponse>(
                    '/register',
                    {
                        name,
                        email,
                        password,
                    },
                )

                return response.data
            } catch (error) {
                throw buildAuthRequestError(
                    error,
                    'Nao foi possivel criar a conta',
                )
            }
        },
        [],
    )

    const requestPasswordReset = useCallback(async (email: string) => {
        try {
            ensureApiUrlConfigured()

            const response = await axiosApp.post<PasswordResetRequestResponse>(
                '/password/forgot',
                {
                    email,
                },
            )

            return response.data
        } catch (error) {
            throw buildAuthRequestError(
                error,
                'Nao foi possivel enviar o link de redefinicao',
            )
        }
    }, [])

    const changePassword = useCallback(async (input: ChangePasswordInput) => {
        try {
            ensureApiUrlConfigured()

            await axiosApp.patch('/me/password', {
                currentPassword: input.currentPassword,
                newPassword: input.newPassword,
            })
        } catch (error) {
            throw buildAuthRequestError(
                error,
                'Nao foi possivel atualizar a senha',
            )
        }
    }, [])

    const setCredits = useCallback(
        async (credits: number) => {
            if (!session || session.user.credits === credits) return

            const nextSession = buildSession(session.token, {
                ...session.user,
                credits,
            })

            await persistSession(nextSession)
        },
        [persistSession, session],
    )

    const logout = useCallback(async () => {
        if (ALWAYS_LOGGED_IN_FOR_TESTS) {
            await persistSession(session ?? buildTestSession())
            return
        }

        await clearSession()
    }, [clearSession, persistSession, session])

    const dismissSessionExpiredNotice = useCallback(() => {
        setIsSessionExpiredNoticeVisible(false)
    }, [])

    const handleSessionExpired = useCallback(async () => {
        await clearSession()
        setIsSessionExpiredNoticeVisible(true)
    }, [clearSession])

    useEffect(() => {
        setAxiosAuthSessionExpiredHandler(handleSessionExpired)

        return () => {
            setAxiosAuthSessionExpiredHandler(null)
        }
    }, [handleSessionExpired])

    return (
        <AuthContext.Provider
            value={{
                user: session?.user ?? null,
                isLoading,
                isSessionExpiredNoticeVisible,
                login,
                register,
                requestPasswordReset,
                dismissSessionExpiredNotice,
                logout,
                changePassword,
                setCredits,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}
