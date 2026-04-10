import AsyncStorage from "@react-native-async-storage/async-storage";
import { isAxiosError } from "axios";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import {
    ApiUser,
    AuthContextValue,
    AuthResponse,
    LegacyStoredAuthSession,
    MockProfile,
    StoredAuthSession,
    UpdateProfileInput,
    User,
} from "../../@types/auth";
import { axiosApp, ensureApiUrlConfigured, setAxiosAuthToken } from "../../services/axios";

const AUTH_KEY = "auth_session";
const LEGACY_AUTH_KEY = "auth_user";
const ALWAYS_LOGGED_IN_FOR_TESTS = false;
const SERVICE_UNAVAILABLE_MESSAGE =
    "O servico pode estar indisponivel no momento. Tente novamente em instantes.";

type AuthErrorKind = "service_unavailable" | "validation";

const TEST_USER: User = {
    id: 0,
    name: "Usuario Teste",
    email: "teste@fitcha.app",
    planActive: true,
};

const TEST_PROFILE: MockProfile = {
    name: TEST_USER.name,
    email: TEST_USER.email,
    mockPassword: "123456",
    hasAiPlan: true,
};

const AuthContext = createContext<AuthContextValue>({
    user: null,
    isLoading: true,
    login: async () => {},
    register: async () => {},
    logout: async () => {},
    updateProfile: async () => {},
    setAiPlanActive: async () => {},
});

export class AuthRequestError extends Error {
    kind: AuthErrorKind;

    constructor(message: string, kind: AuthErrorKind) {
        super(message);
        this.name = "AuthRequestError";
        this.kind = kind;
        Object.setPrototypeOf(this, AuthRequestError.prototype);
    }
}

function normalizeUser(user: ApiUser): User {
    return {
        id: user.ID,
        createdAt: user.CreatedAt,
        updatedAt: user.UpdatedAt,
        planActive: user.planActive,
        name: user.name,
        email: user.email,
    };
}

function buildProfile(user: User, profile?: Partial<MockProfile> | null): MockProfile {
    return {
        name: typeof profile?.name === "string" && profile.name.trim() ? profile.name : user.name,
        email:
            typeof profile?.email === "string" && profile.email.trim() ? profile.email : user.email,
        mockPassword: typeof profile?.mockPassword === "string" ? profile.mockPassword : "",
        hasAiPlan:
            typeof profile?.hasAiPlan === "boolean" ? profile.hasAiPlan : Boolean(user.planActive),
    };
}

function buildSession(
    token: string,
    user: User,
    profile?: Partial<MockProfile> | null,
): StoredAuthSession {
    return {
        token,
        user,
        profile: buildProfile(user, profile),
    };
}

function buildTestSession() {
    return buildSession("test-session-token", TEST_USER, TEST_PROFILE);
}

function buildViewerUser(session: StoredAuthSession) {
    return {
        ...session.user,
        name: session.profile.name,
        email: session.profile.email,
        hasAiPlan: session.profile.hasAiPlan,
    };
}

function parseStoredSession(raw: string): StoredAuthSession | null {
    try {
        const parsed = JSON.parse(raw) as Partial<LegacyStoredAuthSession> | null;

        if (
            !parsed ||
            typeof parsed !== "object" ||
            typeof parsed.token !== "string" ||
            !parsed.user ||
            typeof parsed.user !== "object" ||
            typeof parsed.user.email !== "string" ||
            typeof parsed.user.name !== "string"
        ) {
            return null;
        }

        return buildSession(
            parsed.token,
            {
                id: parsed.user.id,
                createdAt: parsed.user.createdAt,
                updatedAt: parsed.user.updatedAt,
                name: parsed.user.name,
                email: parsed.user.email,
                planActive: parsed.user.planActive,
            },
            parsed.profile,
        );
    } catch {
        return null;
    }
}

function getAuthErrorMessage(error: unknown, fallback: string) {
    if (isAxiosError(error)) {
        const responseData = error.response?.data;

        if (typeof responseData === "string" && responseData.trim()) {
            return responseData;
        }

        if (
            responseData &&
            typeof responseData === "object" &&
            "error" in responseData &&
            typeof responseData.error === "string" &&
            responseData.error.trim()
        ) {
            return responseData.error;
        }
    }

    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return fallback;
}

function isServiceUnavailableError(error: unknown) {
    if (isAxiosError(error)) {
        const status = error.response?.status;

        return !status || status === 404 || status >= 500;
    }

    if (error instanceof Error) {
        return error.message === "Configure EXPO_PUBLIC_API_URL no arquivo frontend/.env";
    }

    return false;
}

function buildAuthRequestError(error: unknown, fallback: string) {
    if (error instanceof AuthRequestError) {
        return error;
    }

    if (isServiceUnavailableError(error)) {
        return new AuthRequestError(SERVICE_UNAVAILABLE_MESSAGE, "service_unavailable");
    }

    return new AuthRequestError(getAuthErrorMessage(error, fallback), "validation");
}

export function isServiceUnavailableAuthError(error: unknown) {
    return error instanceof AuthRequestError && error.kind === "service_unavailable";
}

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<StoredAuthSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const persistSession = useCallback(async (nextSession: StoredAuthSession) => {
        setAxiosAuthToken(nextSession.token);
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(nextSession));
        await AsyncStorage.removeItem(LEGACY_AUTH_KEY);
        setSession(nextSession);
    }, []);

    const clearSession = useCallback(async () => {
        setAxiosAuthToken(null);
        await AsyncStorage.multiRemove([AUTH_KEY, LEGACY_AUTH_KEY]);
        setSession(null);
    }, []);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                if (ALWAYS_LOGGED_IN_FOR_TESTS) {
                    await persistSession(buildTestSession());
                    return;
                }

                const raw = await AsyncStorage.getItem(AUTH_KEY);

                if (!raw) {
                    await AsyncStorage.removeItem(LEGACY_AUTH_KEY);
                    return;
                }

                const storedSession = parseStoredSession(raw);

                if (!storedSession) {
                    await AsyncStorage.multiRemove([AUTH_KEY, LEGACY_AUTH_KEY]);
                    return;
                }

                setAxiosAuthToken(storedSession.token);
                setSession(storedSession);
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, [persistSession]);

    const login = useCallback(
        async (email: string, password: string) => {
            try {
                ensureApiUrlConfigured();

                const response = await axiosApp.post<AuthResponse>("/login", {
                    email,
                    password,
                });

                await persistSession(
                    buildSession(response.data.token, normalizeUser(response.data.user)),
                );
            } catch (error) {
                throw buildAuthRequestError(error, "Nao foi possivel entrar");
            }
        },
        [persistSession],
    );

    const register = useCallback(
        async (name: string, email: string, password: string) => {
            try {
                ensureApiUrlConfigured();

                const response = await axiosApp.post<AuthResponse>("/register", {
                    name,
                    email,
                    password,
                });

                await persistSession(
                    buildSession(response.data.token, normalizeUser(response.data.user)),
                );
            } catch (error) {
                throw buildAuthRequestError(error, "Nao foi possivel criar a conta");
            }
        },
        [persistSession],
    );

    const updateProfile = useCallback(
        async ({ name, email, password }: UpdateProfileInput) => {
            if (!session) return;

            const nextSession = buildSession(session.token, session.user, {
                ...session.profile,
                name: name.trim(),
                email: email.trim(),
                mockPassword: password?.trim() ? password : session.profile.mockPassword,
            });

            await persistSession(nextSession);
        },
        [persistSession, session],
    );

    const setAiPlanActive = useCallback(
        async (active: boolean) => {
            if (!session) return;
            if (
                session.profile.hasAiPlan === active &&
                Boolean(session.user.planActive) === active
            ) {
                return;
            }

            const nextSession = buildSession(
                session.token,
                {
                    ...session.user,
                    planActive: active,
                },
                {
                    ...session.profile,
                    hasAiPlan: active,
                },
            );

            await persistSession(nextSession);
        },
        [persistSession, session],
    );

    const logout = useCallback(async () => {
        if (ALWAYS_LOGGED_IN_FOR_TESTS) {
            await persistSession(session ?? buildTestSession());
            return;
        }

        await clearSession();
    }, [clearSession, persistSession, session]);

    return (
        <AuthContext.Provider
            value={{
                user: session ? buildViewerUser(session) : null,
                isLoading,
                login,
                register,
                logout,
                updateProfile,
                setAiPlanActive,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
