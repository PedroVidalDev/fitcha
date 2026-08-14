import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, View } from 'react-native'
import { type AddMachineEmptyStateProps } from './types'

export function AddMachineEmptyState(props: AddMachineEmptyStateProps) {
    const { sourceFilter } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    const isCustomFilter = sourceFilter === 'custom'

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
                {translate(
                    isCustomFilter
                        ? 'addMachine.emptyCustomTitle'
                        : 'addMachine.emptyCatalogTitle',
                )}
            </Text>
            <Text
                style={{
                    color: t.textMuted,
                    fontSize: 13,
                    lineHeight: 19,
                    marginTop: 6,
                }}
            >
                {translate(
                    isCustomFilter
                        ? 'addMachine.emptyCustomMessage'
                        : 'addMachine.emptyCatalogMessage',
                )}
            </Text>
        </View>
    )
}
