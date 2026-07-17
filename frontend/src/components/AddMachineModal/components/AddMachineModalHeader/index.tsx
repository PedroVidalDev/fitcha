import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text } from 'react-native'
import { type AddMachineModalHeaderProps } from './types'

export function AddMachineModalHeader(props: AddMachineModalHeaderProps) {
    const { titleKey = 'addMachine.title' } = props
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
            {translate(titleKey)}
        </Text>
    )
}
