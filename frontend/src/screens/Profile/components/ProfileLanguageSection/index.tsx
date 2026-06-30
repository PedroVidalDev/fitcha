import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { localeLabels, supportedLocales } from '@/src/translates'
import { Ionicons } from '@expo/vector-icons'
import { Text, TouchableOpacity, View } from 'react-native'
import { ProfileCard } from '../ProfileCard'
import { ProfileSectionHeading } from '../ProfileSectionHeading'
import { type ProfileLanguageSectionProps } from './types'

export function ProfileLanguageSection(props: ProfileLanguageSectionProps) {
    const { locale, onSelectLocale } = props
    const { t } = useI18n()
    const { t: theme } = useTheme()

    return (
        <ProfileCard>
            <ProfileSectionHeading
                title={t('profile.language.title')}
                description={t('profile.language.description')}
            />

            <View style={{ gap: 10 }}>
                {supportedLocales.map((option) => {
                    const isActive = option === locale

                    return (
                        <TouchableOpacity
                            key={option}
                            activeOpacity={0.8}
                            onPress={() => onSelectLocale(option)}
                        >
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: isActive
                                        ? theme.chipBg
                                        : theme.card,
                                    borderRadius: 16,
                                    paddingHorizontal: 16,
                                    paddingVertical: 14,
                                    borderWidth: 0.5,
                                    borderColor: isActive
                                        ? theme.accent
                                        : theme.border,
                                }}
                            >
                                <View>
                                    <Text
                                        style={{
                                            color: isActive
                                                ? theme.textPrimary
                                                : theme.textMuted,
                                            fontSize: 15,
                                            fontWeight: '800',
                                        }}
                                    >
                                        {localeLabels[option]}
                                    </Text>
                                    <Text
                                        style={{
                                            color: theme.textDim,
                                            fontSize: 11,
                                            marginTop: 2,
                                        }}
                                    >
                                        {option}
                                    </Text>
                                </View>

                                <Ionicons
                                    name={
                                        isActive
                                            ? 'checkmark-circle'
                                            : 'ellipse-outline'
                                    }
                                    size={20}
                                    color={
                                        isActive ? theme.accent : theme.textDim
                                    }
                                />
                            </View>
                        </TouchableOpacity>
                    )
                })}
            </View>
        </ProfileCard>
    )
}
