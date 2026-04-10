import { TranslationKey } from "../translates";

type AuthScreen = "login" | "register";
type AuthField = "email" | "password";

export function getAuthErrorPresentation(code: string | null, screen: AuthScreen) {
    if (!code) return null;

    switch (code) {
        case "AUTH_INVALID_CREDENTIALS":
            return {
                field: "password" as AuthField,
                translationKey: "auth.errors.invalidCredentials" as TranslationKey,
            };
        case "AUTH_EMAIL_ALREADY_EXISTS":
            return screen === "register"
                ? {
                      field: "email" as AuthField,
                      translationKey: "auth.errors.emailAlreadyExists" as TranslationKey,
                  }
                : null;
        default:
            return null;
    }
}
