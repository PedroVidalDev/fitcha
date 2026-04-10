import { enUS } from "./en-US";
import { esES } from "./es-ES";
import { ptBR } from "./pt-BR";

export type SupportedLocale = "pt-BR" | "en-US" | "es-ES";
export type TranslationKey = keyof typeof ptBR;
export type TranslationDictionary = Record<TranslationKey, string>;
export type TranslationParams = Record<string, number | string>;

export const defaultLocale: SupportedLocale = "pt-BR";
export const supportedLocales: SupportedLocale[] = ["pt-BR", "en-US", "es-ES"];
export const localeLabels: Record<SupportedLocale, string> = {
    "pt-BR": "Português (Brasil)",
    "en-US": "English (US)",
    "es-ES": "Español",
};

const translations: Record<SupportedLocale, TranslationDictionary> = {
    "pt-BR": ptBR,
    "en-US": enUS,
    "es-ES": esES,
};

const localeAliases: Record<string, SupportedLocale> = {
    pt: "pt-BR",
    "pt-br": "pt-BR",
    en: "en-US",
    "en-us": "en-US",
    es: "es-ES",
    "es-es": "es-ES",
    "es-419": "es-ES",
};

function interpolate(template: string, params?: TranslationParams) {
    if (!params) return template;

    return template.replace(/\{(\w+)\}/g, (_, key: string) => {
        if (!(key in params)) return `{${key}}`;
        return String(params[key]);
    });
}

export function normalizeLocale(locale?: string | null): SupportedLocale {
    if (!locale) return defaultLocale;

    const normalized = locale.replace(/_/g, "-").toLowerCase();

    if (normalized in localeAliases) {
        return localeAliases[normalized];
    }

    return defaultLocale;
}

export function translate(
    locale: SupportedLocale,
    key: TranslationKey,
    params?: TranslationParams,
) {
    const dictionary = translations[locale] ?? translations[defaultLocale];
    const template = dictionary[key] ?? translations[defaultLocale][key] ?? key;

    return interpolate(template, params);
}
