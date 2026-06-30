import { useTheme } from '@/src/contexts/ThemeContext'
import { View } from 'react-native'
import { type ProfileCardProps } from './types'

export function ProfileCard({ children }: ProfileCardProps) {
    const { t: theme } = useTheme()

    return (
        <View
            style={{
                backgroundColor: theme.inputBg,
                borderRadius: 24,
                padding: 20,
                borderWidth: 0.5,
                borderColor: theme.border,
            }}
        >
            {children}
        </View>
    )
}
