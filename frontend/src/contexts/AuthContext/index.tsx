import AsyncStorage from "@react-native-async-storage/async-storage";
import { isAxiosError } from "axios";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { axiosApp, ensureApiUrlConfigured, setAxiosAuthToken } from "../../services/axios";

const AUTH_KEY = "auth_session";
const LEGACY_AUTH_KEY = "auth_user";

type ApiUser = {
    ID?: number;
    CreatedAt?: string;
    UpdatedAt?: string;
    name: string;
    email: string;
};

type User = {
    id?: number;
    createdAt?: string;
    updatedAt?: string;
    name: string;
    email: string;
};

type AuthSession = {
    token: string;
    user: User;
};

type AuthResponse = {
    token: string;
    user: ApiUser;
};

type AuthCtx = {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({
    user: null,
    isLoading: true,
    login: async () => {},
    register: async () => {},
    logout: async () => {},
});

function normalizeUser(user: ApiUser): User {
    return {
        id: user.ID,
        createdAt: user.CreatedAt,
        updatedAt: user.UpdatedAt,
        name: user.name,
        email: user.email,
    };
}

function parseStoredSession(raw: string): AuthSession | null {
    try {
        const parsed = JSON.parse(raw) as Partial<AuthSession> | null;

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

        return {
            token: parsed.token,
            user: {
                id: parsed.user.id,
                createdAt: parsed.user.createdAt,
                updatedAt: parsed.user.updatedAt,
                name: parsed.user.name,
                email: parsed.user.email,
            },
        };
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

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const persistSession = useCallback(async (session: AuthSession) => {
        setAxiosAuthToken(session.token);
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(session));
        await AsyncStorage.removeItem(LEGACY_AUTH_KEY);
        setUser(session.user);
    }, []);

    const clearSession = useCallback(async () => {
        setAxiosAuthToken(null);
        await AsyncStorage.multiRemove([AUTH_KEY, LEGACY_AUTH_KEY]);
        setUser(null);
    }, []);

    useEffect(() => {
        const restoreSession = async () => {
            try {
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
                setUser(storedSession.user);
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = useCallback(
        async (email: string, password: string) => {
            ensureApiUrlConfigured();

            try {
                const response = await axiosApp.post<AuthResponse>("/login", {
                    email,
                    password,
                });

                await persistSession({
                    token: response.data.token,
                    user: normalizeUser(response.data.user),
                });
            } catch (error) {
                throw new Error(getAuthErrorMessage(error, "Nao foi possivel entrar"));
            }
        },
        [persistSession],
    );

    const register = useCallback(
        async (name: string, email: string, password: string) => {
            ensureApiUrlConfigured();

            try {
                const response = await axiosApp.post<AuthResponse>("/register", {
                    name,
                    email,
                    password,
                });

                await persistSession({
                    token: response.data.token,
                    user: normalizeUser(response.data.user),
                });
            } catch (error) {
                throw new Error(getAuthErrorMessage(error, "Nao foi possivel criar a conta"));
            }
        },
        [persistSession],
    );

    const logout = useCallback(async () => {
        await clearSession();
    }, [clearSession]);

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
