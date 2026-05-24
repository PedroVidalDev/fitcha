export type ApiUser = {
    ID?: number;
    CreatedAt?: string;
    UpdatedAt?: string;
    credits?: number;
    verified?: boolean;
    name: string;
    email: string;
};

export type User = {
    id?: number;
    createdAt?: string;
    updatedAt?: string;
    credits: number;
    verified: boolean;
    name: string;
    email: string;
};

export type MockProfile = {
    name: string;
    email: string;
    mockPassword: string;
};

export type AuthenticatedUser = User;

export type StoredAuthSession = {
    token: string;
    user: User;
    profile: MockProfile;
};

export type LegacyStoredAuthSession = {
    token: string;
    user: User;
    profile?: Partial<MockProfile> | null;
};

export type AuthResponse = {
    token: string;
    user: ApiUser;
};

export type RegisterResponse = {
    message: string;
    email: string;
};

export type UpdateProfileInput = {
    name: string;
    email: string;
    password?: string;
};

export type AuthContextValue = {
    user: AuthenticatedUser | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<RegisterResponse>;
    logout: () => Promise<void>;
    updateProfile: (input: UpdateProfileInput) => Promise<void>;
    setCredits: (credits: number) => Promise<void>;
};
