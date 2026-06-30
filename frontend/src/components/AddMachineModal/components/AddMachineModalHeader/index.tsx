import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text } from 'react-native'

export function AddMachineModalHeader() {
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <Text
            style={{
                color: t.accent,
                fontSize: 20,
                fontWeight: '800',
                marginBottom: 18,
            }}
        >
            {translate('addMachine.title')}
        </Text>
    )
}
