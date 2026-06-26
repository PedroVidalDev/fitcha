import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, View } from 'react-native'
import { getUserInitial } from '../../helpers'
import { ProfileCard } from '../ProfileCard'
import { type ProfileHeaderCardProps } from './types'

export function ProfileHeaderCard(props: ProfileHeaderCardProps) {
    const { name } = props
    const { t: theme } = useTheme()
    const { t } = useI18n()

    return (
        <ProfileCard>
            <View
                style={{
                    width: 56,
                    height: 56,
                    borderRadius: 999,
                    backgroundColor: theme.accent,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 16,
                }}
            >
                <Text
                    style={{
                        color: theme.btnColor,
                        fontSize: 20,
                        fontWeight: '900',
                    }}
                >
                    {getUserInitial(name)}
                </Text>
            </View>

            <Text
                style={{
                    color: theme.textDim,
                    fontSize: 11,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    marginBottom: 8,
                }}
            >
                {t('profile.kicker')}
            </Text>

            <Text
                style={{
                    color: theme.textPrimary,
                    fontSize: 28,
                    fontWeight: '900',
                    marginBottom: 8,
                }}
            >
                {name}
            </Text>

            <Text
                style={{
                    color: theme.textMuted,
                    fontSize: 14,
                    lineHeight: 21,
                }}
            >
                {t('profile.header.description')}
            </Text>
        </ProfileCard>
    )
}
