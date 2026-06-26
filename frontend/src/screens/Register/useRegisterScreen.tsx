import { useCallback, useState } from 'react'
import {
    getAuthRequestErrorCode,
    isServiceUnavailableAuthError,
    useAuth,
} from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'
import { useFormErrors } from '../../hooks/useFormValidations'
import { getAuthErrorPresentation } from '../../utils/authErrors'

const EMAIL_REGEX = /\S+@\S+\.\S+/

export function useRegisterScreen() {
    const { t } = useI18n()
    const { register } = useAuth()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isServiceErrorModalVisible, setIsServiceErrorModalVisible] =
        useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const { errors, setError, clearError, clearAll } = useFormErrors()

    const validate = useCallback((): boolean => {
        clearAll()
        let valid = true

        if (!name.trim()) {
            setError('name', t('auth.validation.nameRequired'))
            valid = false
        }

        if (!email.trim()) {
            setError('email', t('auth.validation.emailRequired'))
            valid = false
        } else if (!EMAIL_REGEX.test(email.trim())) {
            setError('email', t('auth.validation.emailInvalid'))
            valid = false
        }

        if (!password.trim()) {
            setError('password', t('auth.validation.passwordCreateRequired'))
            valid = false
        } else if (password.length < 6) {
            setError('password', t('auth.validation.passwordMin'))
            valid = false
        }

        if (!confirmPassword.trim()) {
            setError(
                'confirmPassword',
                t('auth.validation.confirmPasswordRequired'),
            )
            valid = false
        } else if (password !== confirmPassword) {
            setError('confirmPassword', t('auth.validation.passwordMismatch'))
            valid = false
        }

        return valid
    }, [clearAll, confirmPassword, email, name, password, setError, t])

    const handleNameChange = useCallback(
        (value: string) => {
            setName(value)
            clearError('name')
        },
        [clearError],
    )

    const handleEmailChange = useCallback(
        (value: string) => {
            setEmail(value)
            clearError('email')
        },
        [clearError],
    )

    const handlePasswordChange = useCallback(
        (value: string) => {
            setPassword(value)
            clearError('password')
        },
        [clearError],
    )

    const handleConfirmPasswordChange = useCallback(
        (value: string) => {
            setConfirmPassword(value)
            clearError('confirmPassword')
        },
        [clearError],
    )

    const handleRegister = useCallback(async () => {
        if (!validate() || isSubmitting) return

        setIsSubmitting(true)

        try {
            const response = await register(name.trim(), email.trim(), password)
            setSuccessMessage(
                t('auth.register.successMessage', {
                    email: response.email,
                }),
            )
        } catch (error) {
            if (isServiceUnavailableAuthError(error)) {
                setIsServiceErrorModalVisible(true)
                return
            }

            const presentation = getAuthErrorPresentation(
                getAuthRequestErrorCode(error),
                'register',
            )

            if (presentation) {
                setError(presentation.field, t(presentation.translationKey))
                return
            }

            const message =
                error instanceof Error
                    ? error.message
                    : t('auth.errors.genericRegister')

            setError('email', message)
        } finally {
            setIsSubmitting(false)
        }
    }, [email, isSubmitting, name, password, register, setError, t, validate])

    const closeServiceErrorModal = useCallback(() => {
        setIsServiceErrorModalVisible(false)
    }, [])

    const clearSuccessMessage = useCallback(() => {
        setSuccessMessage(null)
    }, [])

    return {
        name,
        email,
        password,
        confirmPassword,
        isSubmitting,
        isServiceErrorModalVisible,
        successMessage,
        errors,
        handleNameChange,
        handleEmailChange,
        handlePasswordChange,
        handleConfirmPasswordChange,
        handleRegister,
        closeServiceErrorModal,
        clearSuccessMessage,
    }
}
