import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { Text, TouchableOpacity, View } from 'react-native'
import { type CreditPurchaseModalHeaderProps } from './types'

export function CreditPurchaseModalHeader(
    props: CreditPurchaseModalHeaderProps,
) {
    const { onClose } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
            }}
        >
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    flex: 1,
                    minWidth: 0,
                }}
            >
                <Ionicons name='sparkles' size={20} color={t.accent} />
                <Text
                    style={{
                        color: t.textPrimary,
                        fontSize: 20,
                        fontWeight: '900',
                        flexShrink: 1,
                    }}
                >
                    {translate('creditCheckout.title')}
                </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                <Ionicons name='close' size={22} color={t.textMuted} />
            </TouchableOpacity>
        </View>
    )
}
