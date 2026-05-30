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

export type AuthenticatedUser = User;

export type StoredAuthSession = {
    token: string;
    user: User;
};

export type LegacyStoredAuthSession = {
    token: string;
    user: User;
    profile?: Record<string, unknown> | null;
};

export type AuthResponse = {
    token: string;
    user: ApiUser;
};

export type RegisterResponse = {
    message: string;
    email: string;
};

export type PasswordResetRequestResponse = {
    message: string;
};

export type ChangePasswordInput = {
    currentPassword: string;
    newPassword: string;
};

export type AuthContextValue = {
    user: AuthenticatedUser | null;
    isLoading: boolean;
    isSessionExpiredNoticeVisible: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<RegisterResponse>;
    requestPasswordReset: (email: string) => Promise<PasswordResetRequestResponse>;
    dismissSessionExpiredNotice: () => void;
    logout: () => Promise<void>;
    changePassword: (input: ChangePasswordInput) => Promise<void>;
    setCredits: (credits: number) => Promise<void>;
};
