import { UserPayment } from '@/src/@types/credit'

export type CreditPurchasePaymentStepProps = {
    payment: UserPayment
    amountLabel: string
    paymentExpiresAt: string | null
    isRefreshingStatus: boolean
    onRefreshStatus: () => void
}
