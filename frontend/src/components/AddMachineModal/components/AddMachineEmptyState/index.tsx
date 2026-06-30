import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, View } from 'react-native'

export function AddMachineEmptyState() {
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <View
            style={{
                borderRadius: 14,
                borderWidth: 0.5,
                borderColor: t.border,
                backgroundColor: t.inputBg,
                padding: 18,
            }}
        >
            <Text
                style={{
                    color: t.textPrimary,
                    fontSize: 15,
                    fontWeight: '700',
                }}
            >
                {translate('addMachine.emptyTitle')}
            </Text>
            <Text
                style={{
                    color: t.textMuted,
                    fontSize: 13,
                    lineHeight: 19,
                    marginTop: 6,
                }}
            >
                {translate('addMachine.emptyMessage')}
            </Text>
        </View>
    )
}
