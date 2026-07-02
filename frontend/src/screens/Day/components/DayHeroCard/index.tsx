import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, View } from 'react-native'
import { type DayHeroCardProps } from './types'

export function DayHeroCard(props: DayHeroCardProps) {
    const { workout, totalMachines } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <LinearGradient
            colors={t.gradientHero}
            style={{
                borderRadius: 22,
                padding: 18,
                marginBottom: 18,
                borderWidth: 1,
                borderColor: t.border,
                overflow: 'hidden',
            }}
        >
            <View
                style={{
                    position: 'absolute',
                    right: -18,
                    top: -26,
                    width: 90,
                    height: 90,
                    borderRadius: 999,
                    backgroundColor: t.chipBg,
                }}
            />
            <Text
                style={{
                    color: t.textDim,
                    fontSize: 11,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                }}
            >
                {translate('day.machineCount', {
                    count: totalMachines,
                    pluralSuffix: totalMachines !== 1 ? 's' : '',
                })}
            </Text>
            <Text
                style={{
                    color: t.accent,
                    fontSize: 24,
                    fontWeight: '900',
                    marginTop: 8,
                }}
            >
                {workout.title}
            </Text>
            <Text
                style={{
                    color: t.textMuted,
                    fontSize: 13,
                    lineHeight: 19,
                    marginTop: 8,
                }}
            >
                {workout.description?.trim() ||
                    translate('day.emptyDescription')}
            </Text>
        </LinearGradient>
    )
}
