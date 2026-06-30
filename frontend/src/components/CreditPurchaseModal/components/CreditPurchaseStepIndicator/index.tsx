import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, View } from 'react-native'
import { type CreditPurchaseStepIndicatorProps } from './types'

export function CreditPurchaseStepIndicator(
    props: CreditPurchaseStepIndicatorProps,
) {
    const { step } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
                {[1, 2, 3].map((item) => (
                    <View
                        key={item}
                        style={{
                            flex: 1,
                            height: 3,
                            borderRadius: 999,
                            backgroundColor:
                                item <= step ? t.accent : t.inputBg,
                        }}
                    />
                ))}
            </View>

            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 18,
                }}
            >
                <Text
                    style={{
                        color: t.textDim,
                        fontSize: 11,
                        fontWeight: '800',
                    }}
                >
                    {translate('creditCheckout.step.quantity')}
                </Text>
                <Text
                    style={{
                        color: t.textDim,
                        fontSize: 11,
                        fontWeight: '800',
                    }}
                >
                    {translate('creditCheckout.step.document')}
                </Text>
                <Text
                    style={{
                        color: t.textDim,
                        fontSize: 11,
                        fontWeight: '800',
                    }}
                >
                    {translate('creditCheckout.step.payment')}
                </Text>
            </View>
        </>
    )
}
