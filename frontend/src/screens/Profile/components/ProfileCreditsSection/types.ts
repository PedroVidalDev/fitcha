import { type UserPayment } from '@/src/@types/credit'

export type ProfileCreditsSectionProps = {
    credits: number
    payment: UserPayment | null
    paymentExpiresAt: string | null
    hasPendingPayment: boolean
    isLoading: boolean
    onOpenModal: () => void
}
