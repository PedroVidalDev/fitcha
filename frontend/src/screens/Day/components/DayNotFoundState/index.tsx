import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, View } from 'react-native'
import { type DayNotFoundStateProps } from './types'

export function DayNotFoundState(props: DayNotFoundStateProps) {
    void props

    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: t.bg,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 24,
            }}
        >
            <Text
                style={{
                    color: t.textPrimary,
                    fontSize: 18,
                    fontWeight: '800',
                }}
            >
                {translate('day.notFoundTitle')}
            </Text>
            <Text
                style={{
                    color: t.textMuted,
                    fontSize: 13,
                    lineHeight: 19,
                    marginTop: 8,
                    textAlign: 'center',
                }}
            >
                {translate('day.notFoundMessage')}
            </Text>
        </View>
    )
}
