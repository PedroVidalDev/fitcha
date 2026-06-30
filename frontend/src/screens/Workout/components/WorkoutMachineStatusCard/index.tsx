import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, View } from 'react-native'
import { type WorkoutMachineStatusCardProps } from './types'

export function WorkoutMachineStatusCard(props: WorkoutMachineStatusCardProps) {
    const { currentHasDraft, currentIsComplete } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <View
            style={{
                backgroundColor: t.inputBg,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderWidth: 0.5,
                borderColor: t.border,
                marginBottom: 18,
            }}
        >
            <Text
                style={{
                    color: currentIsComplete ? t.accent : t.textMuted,
                    fontSize: 13,
                    fontWeight: '800',
                    marginBottom: 4,
                }}
            >
                {currentIsComplete
                    ? translate('workout.status.registeredTitle')
                    : currentHasDraft
                      ? translate('workout.status.draftTitle')
                      : translate('workout.status.skipTitle')}
            </Text>
            <Text
                style={{
                    color: t.textDim,
                    fontSize: 13,
                    lineHeight: 18,
                }}
            >
                {currentIsComplete
                    ? translate('workout.status.registeredMessage')
                    : currentHasDraft
                      ? translate('workout.status.draftMessage')
                      : translate('workout.status.skipMessage')}
            </Text>
        </View>
    )
}
