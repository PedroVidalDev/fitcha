import { LinearGradient } from 'expo-linear-gradient'
import { Text, TouchableOpacity, View } from 'react-native'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { type AddMachineFooterActionsProps } from './types'

export function AddMachineFooterActions(props: AddMachineFooterActionsProps) {
    const { canAdd, onClose, onAdd } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <View
            style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: 12,
                marginTop: 18,
            }}
        >
            <TouchableOpacity onPress={onClose} style={{ padding: 12 }}>
                <Text
                    style={{
                        color: t.textMuted,
                        fontSize: 15,
                        fontWeight: '600',
                    }}
                >
                    {translate('common.actions.cancel')}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={onAdd}
                activeOpacity={0.75}
                disabled={!canAdd}
                style={{ opacity: canAdd ? 1 : 0.5 }}
            >
                <LinearGradient
                    colors={t.gradientAccent}
                    style={{
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        borderRadius: 12,
                    }}
                >
                    <Text
                        style={{
                            color: t.btnColor,
                            fontSize: 15,
                            fontWeight: '800',
                        }}
                    >
                        {translate('common.actions.add')}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    )
}
