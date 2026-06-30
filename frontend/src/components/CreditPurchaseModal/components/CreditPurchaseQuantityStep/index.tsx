import { Input } from '@/src/components/Input'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, TouchableOpacity, View } from 'react-native'
import { type CreditPurchaseQuantityStepProps } from './types'

export function CreditPurchaseQuantityStep(
    props: CreditPurchaseQuantityStepProps,
) {
    const {
        creditQuantity,
        unitAmountLabel,
        totalAmountLabel,
        onCreditQuantityChange,
        onContinue,
    } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <>
            <Text
                style={{
                    color: t.textPrimary,
                    fontSize: 18,
                    fontWeight: '900',
                    marginBottom: 8,
                }}
            >
                {translate('creditCheckout.quantityTitle')}
            </Text>
            <Text
                style={{
                    color: t.textMuted,
                    fontSize: 13,
                    lineHeight: 20,
                    marginBottom: 18,
                }}
            >
                {translate('creditCheckout.quantityDescription')}
            </Text>

            <Input
                label={translate('creditCheckout.quantityLabel')}
                icon='flash-outline'
                value={creditQuantity}
                onChangeText={onCreditQuantityChange}
                placeholder={translate('creditCheckout.quantityPlaceholder')}
                keyboardType='numeric'
                error={undefined}
            />

            <View
                style={{
                    backgroundColor: t.inputBg,
                    borderRadius: 16,
                    borderWidth: 0.5,
                    borderColor: t.border,
                    padding: 16,
                    marginBottom: 18,
                }}
            >
                <Text
                    style={{
                        color: t.textPrimary,
                        fontSize: 14,
                        lineHeight: 21,
                    }}
                >
                    {translate('creditCheckout.quantityHint', {
                        price: unitAmountLabel,
                        total: totalAmountLabel,
                    })}
                </Text>
            </View>

            <TouchableOpacity activeOpacity={0.8} onPress={onContinue}>
                <LinearGradient
                    colors={t.gradientAccent}
                    style={{
                        borderRadius: 16,
                        paddingVertical: 16,
                        alignItems: 'center',
                    }}
                >
                    <Text
                        style={{
                            color: t.btnColor,
                            fontSize: 16,
                            fontWeight: '900',
                        }}
                    >
                        {translate('common.actions.continue')}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </>
    )
}
