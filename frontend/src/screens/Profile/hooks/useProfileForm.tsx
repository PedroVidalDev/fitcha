import { useEffect, useState } from "react";
import { useFormErrors } from "../../../hooks/useFormValidations";
import { ProfileFormValues, UseProfileFormParams, UseProfileFormResult } from "../types";

const EMPTY_VALUES: ProfileFormValues = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
};

export function useProfileForm(props: UseProfileFormParams): UseProfileFormResult {
    const { user, onSubmitProfile } = props;

    const [values, setValues] = useState<ProfileFormValues>(EMPTY_VALUES);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { errors, setError, clearError, clearAll } = useFormErrors();

    useEffect(() => {
        if (!user) {
            setValues(EMPTY_VALUES);
            return;
        }

        setValues({
            name: user.name,
            email: user.email,
            password: "",
            confirmPassword: "",
        });
    }, [user?.email, user?.name]);

    const setField = (field: keyof ProfileFormValues, value: string) => {
        setValues((prev) => ({ ...prev, [field]: value }));
        clearError(field);

        if (field === "password" || field === "confirmPassword") {
            clearError("password");
            clearError("confirmPassword");
        }
    };

    const validate = () => {
        clearAll();
        let valid = true;

        if (!values.name.trim()) {
            setError("name", "Informe seu nome");
            valid = false;
        }

        if (!values.email.trim()) {
            setError("email", "Informe seu e-mail");
            valid = false;
        } else if (!/\S+@\S+\.\S+/.test(values.email.trim())) {
            setError("email", "E-mail inválido");
            valid = false;
        }

        if (values.password.trim() && values.password.trim().length < 6) {
            setError("password", "Mínimo de 6 caracteres");
            valid = false;
        }

        if (values.password.trim() && !values.confirmPassword.trim()) {
            setError("confirmPassword", "Confirme sua nova senha");
            valid = false;
        } else if (
            values.password.trim() &&
            values.password.trim() !== values.confirmPassword.trim()
        ) {
            setError("confirmPassword", "As senhas não coincidem");
            valid = false;
        }

        return valid;
    };

    const handleSubmit = async () => {
        if (!user || !validate() || isSubmitting) return false;

        setIsSubmitting(true);

        try {
            await onSubmitProfile({
                name: values.name.trim(),
                email: values.email.trim(),
                password: values.password.trim() || undefined,
            });

            setValues((prev) => ({
                ...prev,
                password: "",
                confirmPassword: "",
            }));

            return true;
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Não foi possível salvar o perfil";

            setError("email", message);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        values,
        errors,
        isSubmitting,
        setField,
        handleSubmit,
    };
}
