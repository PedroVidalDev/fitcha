import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import {
    defaultLocale,
    normalizeLocale,
    SupportedLocale,
    TranslationKey,
    TranslationParams,
    translate,
} from "../../translates";

const LOCALE_STORAGE_KEY = "app_locale";

type I18nContextValue = {
    locale: SupportedLocale;
    setLocale: (locale: SupportedLocale) => void;
    t: (key: TranslationKey, params?: TranslationParams) => string;
};

const I18nContext = createContext<I18nContextValue>({
    locale: defaultLocale,
    setLocale: () => {},
    t: (key) => key,
});

function detectDeviceLocale(): SupportedLocale {
    return normalizeLocale(Intl.DateTimeFormat().resolvedOptions().locale);
}

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<SupportedLocale>(defaultLocale);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const restoreLocale = async () => {
            const storedLocale = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
            setLocaleState(normalizeLocale(storedLocale ?? detectDeviceLocale()));
            setReady(true);
        };

        void restoreLocale();
    }, []);

    const setLocale = useCallback((nextLocale: SupportedLocale) => {
        setLocaleState(nextLocale);
        void AsyncStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    }, []);

    if (!ready) return null;

    return (
        <I18nContext.Provider
            value={{
                locale,
                setLocale,
                t: (key, params) => translate(locale, key, params),
            }}
        >
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    return useContext(I18nContext);
}
