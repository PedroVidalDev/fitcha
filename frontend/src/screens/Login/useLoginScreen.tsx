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

export function useLoginScreen() {
    const { t } = useI18n()
    const { login, requestPasswordReset } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isServiceErrorModalVisible, setIsServiceErrorModalVisible] =
        useState(false)
    const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] =
        useState(false)
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
    const [forgotPasswordError, setForgotPasswordError] = useState<
        string | undefined
    >()
    const [isRequestingPasswordReset, setIsRequestingPasswordReset] =
        useState(false)
    const [passwordResetSuccessMessage, setPasswordResetSuccessMessage] =
        useState<string | null>(null)

    const { errors, setError, clearError, clearAll } = useFormErrors()

    const validate = useCallback((): boolean => {
        clearAll()
        let valid = true

        if (!email.trim()) {
            setError('email', t('auth.validation.emailRequired'))
            valid = false
        } else if (!EMAIL_REGEX.test(email.trim())) {
            setError('email', t('auth.validation.emailInvalid'))
            valid = false
        }

        if (!password.trim()) {
            setError('password', t('auth.validation.passwordRequired'))
            valid = false
        }

        return valid
    }, [clearAll, email, password, setError, t])

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

    const handleLogin = useCallback(async () => {
        if (!validate() || isSubmitting) return

        setIsSubmitting(true)

        try {
            await login(email.trim(), password)
        } catch (error) {
            if (isServiceUnavailableAuthError(error)) {
                setIsServiceErrorModalVisible(true)
                return
            }

            const presentation = getAuthErrorPresentation(
                getAuthRequestErrorCode(error),
                'login',
            )

            if (presentation) {
                setError(presentation.field, t(presentation.translationKey))
                return
            }

            const message =
                error instanceof Error
                    ? error.message
                    : t('auth.errors.genericLogin')

            setError('password', message)
        } finally {
            setIsSubmitting(false)
        }
    }, [email, isSubmitting, login, password, setError, t, validate])

    const closeServiceErrorModal = useCallback(() => {
        setIsServiceErrorModalVisible(false)
    }, [])

    const closePasswordResetSuccessModal = useCallback(() => {
        setPasswordResetSuccessMessage(null)
    }, [])

    const openForgotPasswordModal = useCallback(() => {
        setForgotPasswordEmail((current) => {
            const nextEmail = email.trim()
            return nextEmail || current
        })
        setForgotPasswordError(undefined)
        setIsForgotPasswordModalVisible(true)
    }, [email])

    const closeForgotPasswordModal = useCallback(() => {
        if (isRequestingPasswordReset) return

        setForgotPasswordError(undefined)
        setIsForgotPasswordModalVisible(false)
    }, [isRequestingPasswordReset])

    const handleForgotPasswordEmailChange = useCallback((value: string) => {
        setForgotPasswordEmail(value)
        setForgotPasswordError(undefined)
    }, [])

    const handleForgotPassword = useCallback(async () => {
        const normalizedEmail = forgotPasswordEmail.trim()

        if (!normalizedEmail) {
            setForgotPasswordError(t('auth.validation.emailRequired'))
            return
        }

        if (!EMAIL_REGEX.test(normalizedEmail)) {
            setForgotPasswordError(t('auth.validation.emailInvalid'))
            return
        }

        if (isRequestingPasswordReset) return

        setIsRequestingPasswordReset(true)

        try {
            await requestPasswordReset(normalizedEmail)
            setIsForgotPasswordModalVisible(false)
            setForgotPasswordError(undefined)
            setPasswordResetSuccessMessage(
                t('auth.resetPassword.successMessage', {
                    email: normalizedEmail,
                }),
            )
        } catch (error) {
            if (isServiceUnavailableAuthError(error)) {
                setIsServiceErrorModalVisible(true)
                return
            }

            const message =
                error instanceof Error
                    ? error.message
                    : t('auth.resetPassword.error')
            setForgotPasswordError(message)
        } finally {
            setIsRequestingPasswordReset(false)
        }
    }, [
        forgotPasswordEmail,
        isRequestingPasswordReset,
        requestPasswordReset,
        t,
    ])

    return {
        email,
        password,
        isSubmitting,
        isServiceErrorModalVisible,
        isForgotPasswordModalVisible,
        forgotPasswordEmail,
        forgotPasswordError,
        isRequestingPasswordReset,
        passwordResetSuccessMessage,
        errors,
        handleEmailChange,
        handlePasswordChange,
        handleLogin,
        closeServiceErrorModal,
        closePasswordResetSuccessModal,
        openForgotPasswordModal,
        closeForgotPasswordModal,
        handleForgotPasswordEmailChange,
        handleForgotPassword,
    }
}
