import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, TextInput } from 'react-native'
import { type AddMachineSearchFieldProps } from './types'

export function AddMachineSearchField(props: AddMachineSearchFieldProps) {
    const { value, onChangeText } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <>
            <Text
                style={{
                    color: t.textDim,
                    fontSize: 11,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: 6,
                }}
            >
                {translate('addMachine.searchLabel')}
            </Text>

            <TextInput
                style={{
                    backgroundColor: t.inputBg,
                    borderRadius: 12,
                    padding: 14,
                    color: t.textPrimary,
                    fontSize: 16,
                    borderWidth: 0.5,
                    borderColor: t.border,
                    marginBottom: 16,
                }}
                placeholder={translate('addMachine.searchPlaceholder')}
                placeholderTextColor={t.textDim}
                value={value}
                onChangeText={onChangeText}
                autoFocus
            />
        </>
    )
}
