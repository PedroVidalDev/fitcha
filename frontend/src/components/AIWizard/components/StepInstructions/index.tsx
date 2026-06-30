import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, TextInput, View } from 'react-native'
import { StepInstructionsProps } from './types'

export const StepInstructions = (props: StepInstructionsProps) => {
    const { value, onChange } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <View>
            <Text
                style={{
                    color: t.textDim,
                    fontSize: 13,
                    lineHeight: 20,
                    marginBottom: 12,
                }}
            >
                {translate('aiWizard.instructions.description')}
            </Text>

            <View
                style={{
                    backgroundColor: t.inputBg,
                    borderRadius: 14,
                    borderWidth: 0.5,
                    borderColor: t.border,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                }}
            >
                <TextInput
                    style={{
                        minHeight: 120,
                        color: t.textPrimary,
                        fontSize: 15,
                        lineHeight: 22,
                        textAlignVertical: 'top',
                    }}
                    placeholder={translate('aiWizard.instructions.placeholder')}
                    placeholderTextColor={t.textDim}
                    multiline
                    value={value}
                    onChangeText={onChange}
                />
            </View>
        </View>
    )
}
