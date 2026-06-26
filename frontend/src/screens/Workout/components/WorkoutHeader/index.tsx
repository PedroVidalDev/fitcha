import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, TouchableOpacity, View } from 'react-native'
import { formatTime } from '../../helpers'
import { type WorkoutHeaderProps } from './types'

export function WorkoutHeader(props: WorkoutHeaderProps) {
    const { elapsed, currentPosition, totalMachines, completedCount, onQuit } =
        props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <LinearGradient
            colors={t.gradientHero}
            style={{
                paddingTop: 60,
                paddingBottom: 16,
                paddingHorizontal: 20,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}
        >
            <TouchableOpacity onPress={onQuit} style={{ padding: 4 }}>
                <Ionicons name='close' size={26} color={t.textMuted} />
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
                <Text
                    style={{
                        color: t.accent,
                        fontSize: 32,
                        fontWeight: '900',
                        fontVariant: ['tabular-nums'],
                    }}
                >
                    {formatTime(elapsed)}
                </Text>
                <Text
                    style={{
                        color: t.textDim,
                        fontSize: 11,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                    }}
                >
                    {translate('workout.position', {
                        current: currentPosition,
                        total: totalMachines,
                    })}
                </Text>
                <Text
                    style={{
                        color: t.textMuted,
                        fontSize: 11,
                        fontWeight: '700',
                        marginTop: 4,
                    }}
                >
                    {translate('workout.completedProgress', {
                        completed: completedCount,
                        total: totalMachines,
                    })}
                </Text>
            </View>

            <View style={{ width: 34 }} />
        </LinearGradient>
    )
}
