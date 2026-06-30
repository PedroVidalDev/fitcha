import { useTheme } from '@/src/contexts/ThemeContext'
import { Text } from 'react-native'
import { type ProfileSectionHeadingProps } from './types'

export function ProfileSectionHeading(props: ProfileSectionHeadingProps) {
    const { title, description } = props
    const { t: theme } = useTheme()

    return (
        <>
            <Text
                style={{
                    color: theme.textPrimary,
                    fontSize: 20,
                    fontWeight: '900',
                    marginBottom: 6,
                }}
            >
                {title}
            </Text>
            <Text
                style={{
                    color: theme.textMuted,
                    fontSize: 13,
                    lineHeight: 20,
                    marginBottom: 18,
                }}
            >
                {description}
            </Text>
        </>
    )
}
