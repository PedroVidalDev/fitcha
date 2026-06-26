import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, TouchableOpacity, View } from 'react-native'
import { type WorkoutFooterActionsProps } from './types'

export function WorkoutFooterActions(props: WorkoutFooterActionsProps) {
    const { canGoBack, isLast, onPressBack, onPressNext } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <View style={{ paddingTop: 28, paddingBottom: 20 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={onPressBack}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        paddingVertical: 16,
                        paddingHorizontal: 18,
                        borderRadius: 16,
                        backgroundColor: t.inputBg,
                        borderWidth: 0.5,
                        borderColor: t.border,
                        flex: 0.95,
                        opacity: canGoBack ? 1 : 0.45,
                    }}
                    disabled={!canGoBack}
                >
                    <Ionicons
                        name='arrow-back-circle-outline'
                        size={20}
                        color={t.textMuted}
                    />
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 16,
                            fontWeight: '800',
                        }}
                    >
                        {translate('common.actions.back')}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={onPressNext}
                    style={{ flex: 1.4 }}
                >
                    <LinearGradient
                        colors={t.gradientAccent}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            paddingVertical: 16,
                            borderRadius: 16,
                        }}
                    >
                        <Ionicons
                            name={
                                isLast
                                    ? 'checkmark-done-circle'
                                    : 'arrow-forward-circle'
                            }
                            size={22}
                            color={t.btnColor}
                        />
                        <Text
                            style={{
                                color: t.btnColor,
                                fontSize: 17,
                                fontWeight: '900',
                            }}
                        >
                            {isLast
                                ? translate('common.actions.finishWorkout')
                                : translate('workout.nextMachine')}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    )
}
