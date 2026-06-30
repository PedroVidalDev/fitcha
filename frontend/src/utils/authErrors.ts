import { TranslationKey } from '../translates'

type AuthScreen = 'login' | 'register'
type AuthField = 'email' | 'password'
type ProfilePasswordField = 'currentPassword'

export function getAuthErrorPresentation(
    code: string | null,
    screen: AuthScreen,
) {
    if (!code) return null

    switch (code) {
        case 'AUTH_INVALID_CREDENTIALS':
            return {
                field: 'password' as AuthField,
                translationKey:
                    'auth.errors.invalidCredentials' as TranslationKey,
            }
        case 'AUTH_EMAIL_ALREADY_EXISTS':
            return screen === 'register'
                ? {
                      field: 'email' as AuthField,
                      translationKey:
                          'auth.errors.emailAlreadyExists' as TranslationKey,
                  }
                : null
        case 'AUTH_EMAIL_NOT_VERIFIED':
            return screen === 'login'
                ? {
                      field: 'email' as AuthField,
                      translationKey:
                          'auth.errors.emailNotVerified' as TranslationKey,
                  }
                : null
        default:
            return null
    }
}

export function getChangePasswordErrorPresentation(code: string | null) {
    if (!code) return null

    switch (code) {
        case 'AUTH_CURRENT_PASSWORD_INVALID':
            return {
                field: 'currentPassword' as ProfilePasswordField,
                translationKey:
                    'auth.errors.currentPasswordInvalid' as TranslationKey,
            }
        default:
            return null
    }
}
