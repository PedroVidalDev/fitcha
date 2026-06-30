import { UserPayment } from '@/src/@types/credit'

export type CreditPurchasePaymentSummaryProps = {
    payment: UserPayment
    amountLabel: string
    paymentExpiresAt: string | null
}
