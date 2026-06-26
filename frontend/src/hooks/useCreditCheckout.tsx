import { useCallback, useEffect, useState } from 'react'
import {
    CreditCheckoutResponse,
    CreditSummaryResponse,
    UserPayment,
} from '../@types/credit'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { createCreditCheckout, getCreditSummary } from '../services/credit'

type LoadOptions = {
    silent?: boolean
}

type UseCreditCheckoutParams = {
    autoLoad?: boolean
}

export function useCreditCheckout(params: UseCreditCheckoutParams = {}) {
    const { autoLoad = false } = params
    const { setCredits } = useAuth()
    const { t } = useI18n()

    const [payment, setPayment] = useState<UserPayment | null>(null)
    const [creditQuantity, setCreditQuantity] = useState('1')
    const [documentNumber, setDocumentNumber] = useState('')
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isCreatingCheckout, setIsCreatingCheckout] = useState(false)
    const [isRefreshingStatus, setIsRefreshingStatus] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const syncSummary = useCallback(
        async (data: CreditSummaryResponse | CreditCheckoutResponse) => {
            setPayment(data.payment)
            await setCredits(data.credits)

            if (data.payment?.payerDocument) {
                setDocumentNumber(data.payment.payerDocument)
            }

            if (data.payment?.creditQuantity) {
                setCreditQuantity(String(data.payment.creditQuantity))
            }

            setStep((current) => {
                if (data.payment?.status === 'pending') return 3
                if (data.payment?.status === 'approved' && current === 3)
                    return 3
                if (current === 3) return 1
                return current
            })
        },
        [setCredits],
    )

    const loadSummary = useCallback(
        async (options?: LoadOptions) => {
            const silent = options?.silent ?? false

            if (!silent) {
                setIsLoading(true)
            } else {
                setIsRefreshingStatus(true)
            }

            try {
                setErrorMessage(null)
                const response = await getCreditSummary()
                await syncSummary(response)
            } catch (error) {
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : t('creditCheckout.error.loadSummary'),
                )
            } finally {
                if (!silent) {
                    setIsLoading(false)
                } else {
                    setIsRefreshingStatus(false)
                }
            }
        },
        [syncSummary, t],
    )

    useEffect(() => {
        if (!autoLoad) return
        void loadSummary()
    }, [autoLoad, loadSummary])

    useEffect(() => {
        if (!isModalVisible || payment?.status !== 'pending') return

        const interval = setInterval(() => {
            void loadSummary({ silent: true })
        }, 5000)

        return () => clearInterval(interval)
    }, [isModalVisible, loadSummary, payment?.status])

    const openModal = useCallback(() => {
        setErrorMessage(null)
        setStep(payment?.status === 'pending' ? 3 : 1)
        setIsModalVisible(true)
        void loadSummary()
    }, [loadSummary, payment?.status])

    const closeModal = useCallback(() => {
        setErrorMessage(null)
        setIsModalVisible(false)

        if (payment?.status !== 'pending') {
            setStep(1)
        }
    }, [payment?.status])

    const goToDocumentStep = useCallback(() => {
        const parsedQuantity = Number.parseInt(creditQuantity, 10)

        if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
            setErrorMessage(t('creditCheckout.error.invalidQuantity'))
            return
        }

        setErrorMessage(null)
        setStep(2)
    }, [creditQuantity, t])

    const goBackStep = useCallback(() => {
        setErrorMessage(null)
        if (step === 2) {
            setStep(1)
        }
    }, [step])

    const generateCheckout = useCallback(async () => {
        const parsedQuantity = Number.parseInt(creditQuantity, 10)
        if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
            setErrorMessage(t('creditCheckout.error.invalidQuantity'))
            return
        }

        const cleanDocument = documentNumber.replace(/\D/g, '')
        if (cleanDocument.length !== 11) {
            setErrorMessage(t('creditCheckout.error.invalidCpf'))
            return
        }

        setIsCreatingCheckout(true)

        try {
            setErrorMessage(null)
            const response = await createCreditCheckout(
                parsedQuantity,
                cleanDocument,
            )
            await syncSummary(response)
            setStep(3)
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : t('creditCheckout.error.generatePix'),
            )
        } finally {
            setIsCreatingCheckout(false)
        }
    }, [creditQuantity, documentNumber, syncSummary, t])

    const refreshStatus = useCallback(async () => {
        await loadSummary({ silent: true })
    }, [loadSummary])

    return {
        payment,
        creditQuantity,
        documentNumber,
        step,
        isModalVisible,
        isLoading,
        isCreatingCheckout,
        isRefreshingStatus,
        errorMessage,
        setCreditQuantity,
        setDocumentNumber,
        openModal,
        closeModal,
        goToDocumentStep,
        goBackStep,
        generateCheckout,
        refreshStatus,
        reloadSummary: loadSummary,
    }
}
