import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'
import { Linking } from 'react-native'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { type CreditPurchasePaymentActionsProps } from './types'

export function CreditPurchasePaymentActions(
    props: CreditPurchasePaymentActionsProps,
) {
    const { payment, isRefreshingStatus, onRefreshStatus } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    if (payment.status === 'approved') {
        return (
            <View
                style={{
                    marginTop: 16,
                    backgroundColor: t.chipBg,
                    borderRadius: 14,
                    padding: 14,
                }}
            >
                <Text
                    style={{
                        color: t.textPrimary,
                        fontSize: 14,
                        lineHeight: 20,
                    }}
                >
                    {translate('creditCheckout.approvedMessage')}
                </Text>
            </View>
        )
    }

    return (
        <View
            style={{
                flexDirection: 'row',
                gap: 12,
                marginTop: 18,
            }}
        >
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onRefreshStatus}
                style={{
                    flex: 1,
                    borderRadius: 14,
                    borderWidth: 0.5,
                    borderColor: t.border,
                    backgroundColor: t.card,
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {isRefreshingStatus ? (
                    <ActivityIndicator color={t.accent} />
                ) : (
                    <Text
                        style={{
                            color: t.textPrimary,
                            fontSize: 14,
                            fontWeight: '800',
                            textAlign: 'center',
                        }}
                    >
                        {translate('creditCheckout.checkPayment')}
                    </Text>
                )}
            </TouchableOpacity>

            {payment.ticketUrl ? (
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => void Linking.openURL(payment.ticketUrl)}
                    style={{ flex: 1 }}
                >
                    <LinearGradient
                        colors={t.gradientAccent}
                        style={{
                            borderRadius: 14,
                            paddingVertical: 14,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text
                            style={{
                                color: t.btnColor,
                                fontSize: 14,
                                fontWeight: '900',
                                textAlign: 'center',
                            }}
                        >
                            {translate('creditCheckout.openCharge')}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            ) : null}
        </View>
    )
}
