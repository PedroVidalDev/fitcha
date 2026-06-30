export type UserPaymentStatus = 'pending' | 'approved' | 'expired' | 'failed'

export type UserPayment = {
    id: number
    userId: number
    provider: string
    status: UserPaymentStatus
    externalReference: string
    providerPaymentId: string
    creditQuantity: number
    unitAmountCents: number
    transactionAmountCents: number
    currency: string
    title: string
    description: string
    payerDocument: string
    qrCode: string
    qrCodeBase64: string
    ticketUrl: string
    paymentExpiresAt?: string | null
    paidAt?: string | null
    creditsAppliedAt?: string | null
    createdAt: string
    updatedAt: string
}

export type CreditCheckoutResponse = {
    payment: UserPayment
    credits: number
    isNew: boolean
}

export type CreditSummaryResponse = {
    payment: UserPayment | null
    credits: number
}
