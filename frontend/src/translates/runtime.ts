import {
    defaultLocale,
    SupportedLocale,
    translate,
    TranslationKey,
    TranslationParams,
} from './index'

let currentLocale: SupportedLocale = defaultLocale

export function setRuntimeLocale(locale: SupportedLocale) {
    currentLocale = locale
}

export function translateRuntime(
    key: TranslationKey,
    params?: TranslationParams,
) {
    return translate(currentLocale, key, params)
}
