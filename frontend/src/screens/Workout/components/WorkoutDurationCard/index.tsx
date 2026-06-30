import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, TouchableOpacity, View } from 'react-native'
import { formatTime } from '../../helpers'
import { type WorkoutDurationCardProps } from './types'

export function WorkoutDurationCard(props: WorkoutDurationCardProps) {
    const { config, onAction } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    const actionLabel =
        config.state === 'running'
            ? translate('workout.duration.stopCta')
            : config.state === 'completed'
              ? translate('workout.duration.restartCta')
              : translate('workout.duration.startCta')

    const statusText =
        config.state === 'running'
            ? translate('workout.duration.active')
            : config.state === 'completed'
              ? translate('workout.duration.done')
              : translate('workout.duration.idle')

    return (
        <View
            style={{
                backgroundColor: t.inputBg,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderWidth: 0.5,
                borderColor:
                    config.state === 'running' ? t.accent + '55' : t.border,
                gap: 14,
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
                        color: t.textDim,
                        fontSize: 11,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 2,
                    }}
                >
                    {translate('workout.duration.title')}
                </Text>

                {config.lastDurationSeconds !== null ? (
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 12,
                            fontWeight: '700',
                        }}
                    >
                        {translate('workout.duration.lastRecord', {
                            value: formatTime(config.lastDurationSeconds),
                        })}
                    </Text>
                ) : null}
            </View>

            <View
                style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: t.bg,
                    borderRadius: 14,
                    paddingVertical: 20,
                    borderWidth: 0.5,
                    borderColor: t.border,
                }}
            >
                <Text
                    style={{
                        color:
                            config.state === 'running'
                                ? t.accent
                                : t.textPrimary,
                        fontSize: 34,
                        fontWeight: '900',
                        fontVariant: ['tabular-nums'],
                    }}
                >
                    {formatTime(config.elapsedSeconds)}
                </Text>
                <Text
                    style={{
                        color: t.textDim,
                        fontSize: 13,
                        lineHeight: 18,
                        marginTop: 8,
                        textAlign: 'center',
                    }}
                >
                    {statusText}
                </Text>
            </View>

            <TouchableOpacity
                activeOpacity={0.85}
                onPress={onAction}
                style={{ borderRadius: 12 }}
            >
                <LinearGradient
                    colors={
                        config.state === 'completed'
                            ? [t.card, t.card]
                            : t.gradientAccent
                    }
                    style={{
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderWidth: config.state === 'completed' ? 0.5 : 0,
                        borderColor:
                            config.state === 'completed'
                                ? t.border
                                : 'transparent',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                    }}
                >
                    <Ionicons
                        name={
                            config.state === 'running'
                                ? 'stop-circle-outline'
                                : 'play-circle-outline'
                        }
                        size={18}
                        color={
                            config.state === 'completed'
                                ? t.textPrimary
                                : t.btnColor
                        }
                    />
                    <Text
                        style={{
                            color:
                                config.state === 'completed'
                                    ? t.textPrimary
                                    : t.btnColor,
                            fontSize: 14,
                            fontWeight: '800',
                        }}
                    >
                        {actionLabel}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    )
}
