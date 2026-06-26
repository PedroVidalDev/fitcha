import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, TouchableOpacity, View } from 'react-native'
import { type DayStartWorkoutButtonProps } from './types'

export function DayStartWorkoutButton(props: DayStartWorkoutButtonProps) {
    const { onPress } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <View
            style={{
                position: 'absolute',
                bottom: 24,
                left: 16,
                right: 16,
            }}
        >
            <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
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
                    <Ionicons name='play-circle' size={24} color={t.btnColor} />
                    <Text
                        style={{
                            color: t.btnColor,
                            fontSize: 18,
                            fontWeight: '900',
                        }}
                    >
                        {translate('common.actions.startWorkout')}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    )
}
