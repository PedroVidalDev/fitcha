import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Image, Text, View } from 'react-native'
import { type CreditPurchasePaymentQrCodeProps } from './types'

export function CreditPurchasePaymentQrCode(
    props: CreditPurchasePaymentQrCodeProps,
) {
    const { payment } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <>
            {payment.status === 'pending' && payment.qrCodeBase64 ? (
                <View
                    style={{
                        alignItems: 'center',
                        marginVertical: 10,
                    }}
                >
                    <Image
                        source={{
                            uri: `data:image/png;base64,${payment.qrCodeBase64}`,
                        }}
                        style={{
                            width: 220,
                            height: 220,
                            borderRadius: 16,
                            backgroundColor: '#FFF',
                        }}
                    />
                </View>
            ) : null}

            {payment.status === 'pending' && payment.qrCode ? (
                <View
                    style={{
                        backgroundColor: t.card,
                        borderRadius: 14,
                        padding: 14,
                        marginTop: 8,
                    }}
                >
                    <Text
                        style={{
                            color: t.textPrimary,
                            fontSize: 13,
                            fontWeight: '800',
                            marginBottom: 8,
                        }}
                    >
                        {translate('creditCheckout.copyPastePix')}
                    </Text>
                    <Text
                        selectable
                        style={{
                            color: t.textMuted,
                            fontSize: 12,
                            lineHeight: 18,
                        }}
                    >
                        {payment.qrCode}
                    </Text>
                </View>
            ) : null}
        </>
    )
}
