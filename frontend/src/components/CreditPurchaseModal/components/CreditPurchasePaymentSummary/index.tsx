import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, View } from 'react-native'
import { type CreditPurchasePaymentSummaryProps } from './types'

export function CreditPurchasePaymentSummary(
    props: CreditPurchasePaymentSummaryProps,
) {
    const { payment, amountLabel, paymentExpiresAt } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                }}
            >
                <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                        style={{
                            color: t.textPrimary,
                            fontSize: 17,
                            fontWeight: '900',
                            marginBottom: 4,
                        }}
                    >
                        {amountLabel}
                    </Text>
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 13,
                        }}
                    >
                        {translate('creditCheckout.summaryCredits', {
                            count: payment.creditQuantity,
                        })}
                    </Text>
                </View>

                <View
                    style={{
                        backgroundColor:
                            payment.status === 'approved'
                                ? t.accent
                                : t.surface,
                        borderRadius: 999,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        marginLeft: 12,
                    }}
                >
                    <Text
                        style={{
                            color:
                                payment.status === 'approved'
                                    ? t.btnColor
                                    : t.textPrimary,
                            fontSize: 11,
                            fontWeight: '900',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                        }}
                    >
                        {payment.status === 'approved'
                            ? translate('creditCheckout.status.paid')
                            : translate('creditCheckout.status.awaitingPix')}
                    </Text>
                </View>
            </View>

            {paymentExpiresAt ? (
                <Text
                    style={{
                        color: t.textMuted,
                        fontSize: 13,
                        lineHeight: 19,
                        marginBottom: 12,
                    }}
                >
                    {translate('creditCheckout.pixValidUntil', {
                        date: paymentExpiresAt,
                    })}
                </Text>
            ) : null}
        </>
    )
}
