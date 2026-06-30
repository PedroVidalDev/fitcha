import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import { type WorkoutSeriesCardProps } from './types'

export function WorkoutSeriesCard(props: WorkoutSeriesCardProps) {
    const { item, onChangeField, onConfirmField } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <View
            style={{
                gap: 12,
                backgroundColor: item.isLocked ? t.card : t.inputBg,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderWidth: 0.5,
                borderColor: t.border,
                opacity: item.isLocked ? 0.55 : 1,
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
                        fontSize: 13,
                        fontWeight: '700',
                    }}
                >
                    {item.label}
                </Text>

                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <Ionicons
                        name={
                            item.isConfirmed
                                ? 'checkmark-circle'
                                : item.isLocked
                                  ? 'lock-closed'
                                  : 'ellipse-outline'
                        }
                        size={14}
                        color={
                            item.isConfirmed
                                ? t.accent
                                : item.isLocked
                                  ? t.textDim
                                  : t.textMuted
                        }
                    />
                    <Text
                        style={{
                            color: item.isConfirmed ? t.accent : t.textMuted,
                            fontSize: 12,
                            fontWeight: '700',
                        }}
                    >
                        {translate(
                            item.isConfirmed
                                ? 'workout.series.confirmedState'
                                : item.isLocked
                                  ? 'workout.series.lockedState'
                                  : 'workout.series.readyState',
                        )}
                    </Text>
                </View>
            </View>

            <View
                style={{
                    flexDirection: 'row',
                    gap: 10,
                }}
            >
                {item.requiresWeight ? (
                    <View style={{ flex: 1, gap: 8 }}>
                        <Text
                            style={{
                                color: t.textMuted,
                                fontSize: 11,
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                            }}
                        >
                            {translate('workout.series.weightLabel')}
                        </Text>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <TextInput
                                style={{
                                    flex: 1,
                                    paddingHorizontal: 14,
                                    paddingVertical: 14,
                                    borderRadius: 12,
                                    backgroundColor: t.bg,
                                    color: t.textPrimary,
                                    fontSize: 20,
                                    fontWeight: '800',
                                    textAlign: 'center',
                                    borderWidth: 0.5,
                                    borderColor: item.isConfirmed
                                        ? t.accent + '55'
                                        : t.border,
                                }}
                                placeholder={item.weightPlaceholder}
                                placeholderTextColor={t.textDim}
                                keyboardType='numeric'
                                value={item.weightValue}
                                editable={!item.isLocked}
                                onChangeText={(value) =>
                                    onChangeField(item.key, 'weight', value)
                                }
                            />
                            <Text
                                style={{
                                    color: t.textMuted,
                                    fontSize: 14,
                                    fontWeight: '600',
                                }}
                            >
                                {translate('common.units.kg')}
                            </Text>
                        </View>
                    </View>
                ) : null}

                <View
                    style={{
                        width: item.requiresWeight ? 116 : '100%',
                        flex: item.requiresWeight ? undefined : 1,
                        gap: 8,
                    }}
                >
                    <Text
                        style={{
                            color: t.textDim,
                            fontSize: 11,
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                        }}
                    >
                        {translate('workout.series.repsLabel')}
                    </Text>
                    <TextInput
                        style={{
                            paddingHorizontal: 14,
                            paddingVertical: 14,
                            borderRadius: 12,
                            backgroundColor: t.bg,
                            color: t.textPrimary,
                            fontSize: 20,
                            fontWeight: '800',
                            textAlign: 'center',
                            borderWidth: 0.5,
                            borderColor: item.isConfirmed
                                ? t.accent + '55'
                                : t.border,
                        }}
                        placeholder={item.repsPlaceholder}
                        placeholderTextColor={t.textDim}
                        keyboardType='numeric'
                        value={item.repsValue}
                        editable={!item.isLocked}
                        onChangeText={(value) =>
                            onChangeField(item.key, 'reps', value)
                        }
                    />
                </View>
            </View>

            <View>
                <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={!item.canConfirm}
                    onPress={() => onConfirmField(item.key)}
                    style={{
                        borderRadius: 12,
                        opacity: item.canConfirm || item.isConfirmed ? 1 : 0.45,
                    }}
                >
                    <LinearGradient
                        colors={
                            item.isConfirmed
                                ? [t.accent + '26', t.accent + '12']
                                : item.canConfirm
                                  ? t.gradientAccent
                                  : [t.card, t.card]
                        }
                        style={{
                            width: '100%',
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                            borderRadius: 12,
                            borderWidth: item.isConfirmed ? 0.5 : 0,
                            borderColor: item.isConfirmed
                                ? t.accent + '55'
                                : 'transparent',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                        }}
                    >
                        <Ionicons
                            name={
                                item.isConfirmed
                                    ? 'checkmark-circle'
                                    : 'checkmark-outline'
                            }
                            size={16}
                            color={
                                item.isConfirmed
                                    ? t.accent
                                    : item.canConfirm
                                      ? t.btnColor
                                      : t.textDim
                            }
                        />
                        <Text
                            style={{
                                color: item.isConfirmed
                                    ? t.accent
                                    : item.canConfirm
                                      ? t.btnColor
                                      : t.textDim,
                                fontSize: 13,
                                fontWeight: '800',
                            }}
                        >
                            {translate(
                                item.isConfirmed
                                    ? 'workout.series.confirmedCta'
                                    : 'workout.series.confirmCta',
                            )}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    )
}
