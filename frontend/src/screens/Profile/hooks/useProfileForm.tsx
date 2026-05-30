import { useEffect, useState } from "react";
import { getAuthRequestErrorCode } from "../../../contexts/AuthContext";
import { useI18n } from "../../../contexts/I18nContext";
import { useFormErrors } from "../../../hooks/useFormValidations";
import { getChangePasswordErrorPresentation } from "../../../utils/authErrors";
import { ProfileFormValues, UseProfileFormParams, UseProfileFormResult } from "../types";

const EMPTY_VALUES: ProfileFormValues = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
};

export function useProfileForm(props: UseProfileFormParams): UseProfileFormResult {
    const { user, onSubmitPasswordChange } = props;
    const { t } = useI18n();

    const [values, setValues] = useState<ProfileFormValues>(EMPTY_VALUES);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { errors, setError, clearError, clearAll } = useFormErrors();

    useEffect(() => {
        if (!user) {
            setValues(EMPTY_VALUES);
            return;
        }

        setValues(EMPTY_VALUES);
    }, [user]);

    const setField = (field: keyof ProfileFormValues, value: string) => {
        setValues((prev) => ({ ...prev, [field]: value }));
        clearError(field);

        if (field === "currentPassword" || field === "newPassword" || field === "confirmPassword") {
            clearError("currentPassword");
            clearError("newPassword");
            clearError("confirmPassword");
        }
    };

    const validate = () => {
        clearAll();
        let valid = true;

        if (!values.currentPassword.trim()) {
            setError("currentPassword", t("profile.form.currentPasswordRequired"));
            valid = false;
        }

        if (!values.newPassword.trim()) {
            setError("newPassword", t("profile.form.newPasswordRequired"));
            valid = false;
        } else if (values.newPassword.trim().length < 6) {
            setError("newPassword", t("auth.validation.passwordMin"));
            valid = false;
        }

        if (!values.confirmPassword.trim()) {
            setError("confirmPassword", t("auth.validation.confirmPasswordRequired"));
            valid = false;
        } else if (
            values.newPassword.trim() &&
            values.newPassword.trim() !== values.confirmPassword.trim()
        ) {
            setError("confirmPassword", t("auth.validation.passwordMismatch"));
            valid = false;
        }

        return valid;
    };

    const handleSubmit = async () => {
        if (!user || !validate() || isSubmitting) return false;

        setIsSubmitting(true);

        try {
            await onSubmitPasswordChange({
                currentPassword: values.currentPassword.trim(),
                newPassword: values.newPassword.trim(),
            });

            setValues(EMPTY_VALUES);

            return true;
        } catch (error) {
            const presentation = getChangePasswordErrorPresentation(getAuthRequestErrorCode(error));
            if (presentation) {
                setError(presentation.field, t(presentation.translationKey));
                return false;
            }

            const message = error instanceof Error ? error.message : t("profile.form.saveError");

            setError("currentPassword", message);
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
