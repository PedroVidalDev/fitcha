import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, View } from 'react-native'
import { type ProfileAccountInfoFieldProps } from './types'

export function ProfileAccountInfoField(props: ProfileAccountInfoFieldProps) {
    const { label, value } = props
    const { t: theme } = useTheme()

    return (
        <View
            style={{
                backgroundColor: theme.card,
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderWidth: 0.5,
                borderColor: theme.border,
            }}
        >
            <Text
                style={{
                    color: theme.textDim,
                    fontSize: 11,
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: 1.1,
                    marginBottom: 6,
                }}
            >
                {label}
            </Text>
            <Text
                style={{
                    color: theme.textPrimary,
                    fontSize: 15,
                    fontWeight: '700',
                }}
            >
                {value}
            </Text>
        </View>
    )
}
