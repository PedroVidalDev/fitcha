import { CreditPurchaseModal } from '@/src/components/CreditPurchaseModal'
import { type ProfileCreditsModalProps } from './types'

export function ProfileCreditsModal(props: ProfileCreditsModalProps) {
    const {
        visible,
        step,
        payment,
        creditQuantity,
        documentNumber,
        isLoading,
        isCreatingCheckout,
        isRefreshingStatus,
        errorMessage,
        onClose,
        onCreditQuantityChange,
        onDocumentNumberChange,
        onContinue,
        onBack,
        onGenerateCheckout,
        onRefreshStatus,
    } = props

    return (
        <CreditPurchaseModal
            visible={visible}
            step={step}
            payment={payment}
            creditQuantity={creditQuantity}
            documentNumber={documentNumber}
            isLoading={isLoading}
            isCreatingCheckout={isCreatingCheckout}
            isRefreshingStatus={isRefreshingStatus}
            errorMessage={errorMessage}
            onClose={onClose}
            onCreditQuantityChange={onCreditQuantityChange}
            onDocumentNumberChange={onDocumentNumberChange}
            onContinue={onContinue}
            onBack={onBack}
            onGenerateCheckout={onGenerateCheckout}
            onRefreshStatus={onRefreshStatus}
        />
    )
}
