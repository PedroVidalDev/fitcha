import { defaultLocale, SupportedLocale, TranslationKey, TranslationParams, translate } from "./index";

let currentLocale: SupportedLocale = defaultLocale;

export function setRuntimeLocale(locale: SupportedLocale) {
    currentLocale = locale;
}

export function translateRuntime(key: TranslationKey, params?: TranslationParams) {
    return translate(currentLocale, key, params);
}
