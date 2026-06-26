import { useTheme } from '@/src/contexts/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'
import { ReactNode } from 'react'
import { Platform, View } from 'react-native'

export function DashboardPanel({ children }: { children: ReactNode }) {
    const { t } = useTheme()

    return (
        <View
            style={{
                borderRadius: 22,
                overflow: 'hidden',
                ...Platform.select({
                    ios: {
                        shadowColor: t.shadow,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.08,
                        shadowRadius: 12,
                    },
                    android: { elevation: 5 },
                }),
            }}
        >
            <LinearGradient
                colors={t.gradientCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    borderRadius: 22,
                    padding: 18,
                    borderWidth: 0.5,
                    borderColor: t.border,
                }}
            >
                {children}
            </LinearGradient>
        </View>
    )
}
