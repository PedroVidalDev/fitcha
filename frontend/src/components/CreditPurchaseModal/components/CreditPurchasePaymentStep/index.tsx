import { useTheme } from '@/src/contexts/ThemeContext'
import { View } from 'react-native'
import { CreditPurchasePaymentActions } from '../CreditPurchasePaymentActions'
import { CreditPurchasePaymentQrCode } from '../CreditPurchasePaymentQrCode'
import { CreditPurchasePaymentSummary } from '../CreditPurchasePaymentSummary'
import { type CreditPurchasePaymentStepProps } from './types'

export function CreditPurchasePaymentStep(
    props: CreditPurchasePaymentStepProps,
) {
    const {
        payment,
        amountLabel,
        paymentExpiresAt,
        isRefreshingStatus,
        onRefreshStatus,
    } = props
    const { t } = useTheme()

    return (
        <View
            style={{
                backgroundColor: t.inputBg,
                borderRadius: 18,
                borderWidth: 0.5,
                borderColor: t.border,
                padding: 18,
            }}
        >
            <CreditPurchasePaymentSummary
                payment={payment}
                amountLabel={amountLabel}
                paymentExpiresAt={paymentExpiresAt}
            />

            <CreditPurchasePaymentQrCode payment={payment} />

            <CreditPurchasePaymentActions
                payment={payment}
                isRefreshingStatus={isRefreshingStatus}
                onRefreshStatus={onRefreshStatus}
            />
        </View>
    )
}
