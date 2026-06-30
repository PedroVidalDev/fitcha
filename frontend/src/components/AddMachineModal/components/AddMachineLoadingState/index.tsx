import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { ActivityIndicator, Text, View } from 'react-native'

export function AddMachineLoadingState() {
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <View
            style={{
                paddingVertical: 32,
                alignItems: 'center',
                gap: 12,
            }}
        >
            <ActivityIndicator size='small' color={t.accent} />
            <Text style={{ color: t.textMuted, fontSize: 13 }}>
                {translate('addMachine.loading')}
            </Text>
        </View>
    )
}
