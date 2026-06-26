import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, View } from 'react-native'

export const EmptyWorkout = () => {
    const { t: translate } = useI18n()
    const { t } = useTheme()

    return (
        <View
            style={{
                backgroundColor: t.inputBg,
                borderRadius: 18,
                borderWidth: 0.5,
                borderColor: t.border,
                padding: 18,
            }}
        >
            <Text
                style={{
                    color: t.textPrimary,
                    fontSize: 16,
                    fontWeight: '800',
                }}
            >
                {translate('week.emptyDay')}
            </Text>
            <Text
                style={{
                    color: t.textMuted,
                    fontSize: 13,
                    lineHeight: 19,
                    marginTop: 6,
                }}
            >
                {translate('week.emptyHint')}
            </Text>
        </View>
    )
}
