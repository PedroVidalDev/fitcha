import { type SupportedLocale } from '@/src/translates'

export type ProfileLanguageSectionProps = {
    locale: SupportedLocale
    onSelectLocale: (locale: SupportedLocale) => void
}
