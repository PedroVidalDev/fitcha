import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

const AUTH_KEY = "auth_user";

type User = {
    name: string;
    email: string;
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

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Checa se já tem sessão salva
    useEffect(() => {
        AsyncStorage.getItem(AUTH_KEY).then((raw) => {
            if (raw) setUser(JSON.parse(raw));
            setIsLoading(false);
        });
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        // TODO: Substituir por chamada real à API
        // Por enquanto só simula um login
        const fakeUser: User = { name: email.split("@")[0], email };
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(fakeUser));
        setUser(fakeUser);
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        // TODO: Substituir por chamada real à API
        const fakeUser: User = { name, email };
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(fakeUser));
        setUser(fakeUser);
    }, []);

    const logout = useCallback(async () => {
        await AsyncStorage.removeItem(AUTH_KEY);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
