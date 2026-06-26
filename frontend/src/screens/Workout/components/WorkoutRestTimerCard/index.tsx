import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, View } from 'react-native'
import { formatTime } from '../../helpers'
import { type WorkoutRestTimerCardProps } from './types'

export function WorkoutRestTimerCard(props: WorkoutRestTimerCardProps) {
    const { restStartedAt, restElapsed } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <View
            style={{
                backgroundColor: restStartedAt ? t.chipBg : t.inputBg,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderWidth: 0.5,
                borderColor: restStartedAt ? t.accent + '55' : t.border,
                marginBottom: 18,
                gap: 6,
            }}
        >
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                }}
            >
                <Text
                    style={{
                        color: t.textMuted,
                        fontSize: 12,
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: 1.4,
                    }}
                >
                    {translate('workout.rest.title')}
                </Text>
                <Text
                    style={{
                        color: restStartedAt ? t.accent : t.textPrimary,
                        fontSize: 24,
                        fontWeight: '900',
                        fontVariant: ['tabular-nums'],
                    }}
                >
                    {restStartedAt ? formatTime(restElapsed) : '--:--'}
                </Text>
            </View>
            <Text
                style={{
                    color: t.textDim,
                    fontSize: 13,
                    lineHeight: 18,
                }}
            >
                {translate(
                    restStartedAt ? 'workout.rest.active' : 'workout.rest.idle',
                )}
            </Text>
        </View>
    )
}
