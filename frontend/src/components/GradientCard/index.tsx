import { LinearGradient } from 'expo-linear-gradient'
import { Platform, TouchableOpacity, View } from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'
import { GradientCardProps } from './types'

export const GradientCard = (props: GradientCardProps) => {
    const { children, onPress, onLongPress } = props

    const { t } = useTheme()
    return (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={onPress}
            onLongPress={onLongPress}
            delayLongPress={400}
            style={{
                borderRadius: 16,
                ...Platform.select({
                    ios: {
                        shadowColor: t.shadow,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.08,
                        shadowRadius: 12,
                    },
                    android: { elevation: 6 },
                }),
            }}
        >
            <LinearGradient
                colors={t.gradientCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    position: 'relative',
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: 16,
                    padding: 16,
                    gap: 14,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: t.border,
                }}
            >
                <View
                    style={{
                        position: 'absolute',
                        top: -20,
                        right: -14,
                        width: 82,
                        height: 82,
                        borderRadius: 999,
                        backgroundColor: t.chipBg,
                    }}
                />
                <View
                    style={{
                        position: 'absolute',
                        bottom: -26,
                        left: -18,
                        width: 70,
                        height: 70,
                        borderRadius: 999,
                        backgroundColor: t.chipBg,
                        opacity: 0.7,
                    }}
                />
                {children}
            </LinearGradient>
        </TouchableOpacity>
    )
}
