import { UserPayment } from '@/src/@types/credit'

export type CreditPurchasePaymentActionsProps = {
    payment: UserPayment
    isRefreshingStatus: boolean
    onRefreshStatus: () => void
}
