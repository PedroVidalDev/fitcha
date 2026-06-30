import { UserPayment } from '../../@types/credit'

export type CreditPurchaseStep = 1 | 2 | 3

export type CreditPurchaseModalProps = {
    visible: boolean
    step: CreditPurchaseStep
    payment: UserPayment | null
    creditQuantity: string
    documentNumber: string
    isLoading: boolean
    isCreatingCheckout: boolean
    isRefreshingStatus: boolean
    errorMessage: string | null
    onClose: () => void
    onCreditQuantityChange: (value: string) => void
    onDocumentNumberChange: (value: string) => void
    onContinue: () => void
    onBack: () => void
    onGenerateCheckout: () => void
    onRefreshStatus: () => void
}
