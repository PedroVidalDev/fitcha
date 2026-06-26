import { useTheme } from '@/src/contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { Text, View } from 'react-native'

export function StatCard(props: {
    index: number
    title: string
    value: string
    hint: string
    icon: keyof typeof Ionicons.glyphMap
}) {
    const { index, title, value, hint, icon } = props
    const { t } = useTheme()
    const backgroundColor = t.home.background[index] ?? t.home.background[0]
    const borderColor = t.home.border[index] ?? t.home.border[0]
    const iconBackgroundColor = t.home.iconBg[index] ?? t.home.iconBg[0]
    const iconColor = t.home.iconColor[index] ?? t.home.iconColor[0]

    return (
        <View
            style={{
                flex: 1,
                minWidth: 0,
                backgroundColor,
                borderRadius: 18,
                padding: 14,
                borderWidth: 1,
                borderColor,
            }}
        >
            <View
                style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    backgroundColor: iconBackgroundColor,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12,
                }}
            >
                <Ionicons name={icon} size={18} color={iconColor} />
            </View>
            <Text
                style={{
                    color: t.textDim,
                    fontSize: 11,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 1.6,
                }}
            >
                {title}
            </Text>
            <Text
                style={{
                    color: t.textPrimary,
                    fontSize: 23,
                    fontWeight: '900',
                    marginTop: 6,
                }}
            >
                {value}
            </Text>
            <Text
                style={{
                    color: t.textMuted,
                    fontSize: 12,
                    lineHeight: 17,
                    marginTop: 4,
                }}
            >
                {hint}
            </Text>
        </View>
    )
}
