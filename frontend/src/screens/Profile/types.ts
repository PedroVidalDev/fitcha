import { AuthenticatedUser, UpdateProfileInput } from "../../@types/auth";

export type ProfileFormValues = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
};

export type UseProfileFormParams = {
    user: AuthenticatedUser | null;
    onSubmitProfile: (input: UpdateProfileInput) => Promise<void>;
};

export type UseProfileFormResult = {
    values: ProfileFormValues;
    errors: Record<string, string>;
    isSubmitting: boolean;
    setField: (field: keyof ProfileFormValues, value: string) => void;
    handleSubmit: () => Promise<boolean>;
};
