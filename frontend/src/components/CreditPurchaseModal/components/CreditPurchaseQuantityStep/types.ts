export type CreditPurchaseQuantityStepProps = {
    creditQuantity: string
    unitAmountLabel: string
    totalAmountLabel: string
    onCreditQuantityChange: (value: string) => void
    onContinue: () => void
}
