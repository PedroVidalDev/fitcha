import { useCallback, useState } from "react";

type Errors = Record<string, string>;

export function useFormErrors() {
    const [errors, setErrors] = useState<Errors>({});

    const setError = useCallback((field: string, message: string) => {
        setErrors((prev) => ({ ...prev, [field]: message }));
    }, []);

    const clearError = useCallback((field: string) => {
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }, []);

    const clearAll = useCallback(() => setErrors({}), []);

    const hasErrors = Object.keys(errors).length > 0;

    return { errors, setError, clearError, clearAll, hasErrors };
}
