export type CreditPurchaseDocumentStepProps = {
    quantity: number
    amountLabel: string
    documentNumber: string
    isCreatingCheckout: boolean
    onDocumentNumberChange: (value: string) => void
    onBack: () => void
    onGenerateCheckout: () => void
}
