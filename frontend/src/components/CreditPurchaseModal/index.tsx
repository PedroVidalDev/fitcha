import { ScrollView, Text } from 'react-native'
import { useI18n } from '../../contexts/I18nContext'
import { useTheme } from '../../contexts/ThemeContext'
import { AppModal } from '../AppModal'
import { CreditPurchaseDocumentStep } from './components/CreditPurchaseDocumentStep'
import { CreditPurchaseErrorMessage } from './components/CreditPurchaseErrorMessage'
import { CreditPurchaseLoadingState } from './components/CreditPurchaseLoadingState'
import { CreditPurchaseModalHeader } from './components/CreditPurchaseModalHeader'
import { CreditPurchasePaymentStep } from './components/CreditPurchasePaymentStep'
import { CreditPurchaseQuantityStep } from './components/CreditPurchaseQuantityStep'
import { CreditPurchaseStepIndicator } from './components/CreditPurchaseStepIndicator'
import { formatCurrency, formatDate } from './helpers'
import { type CreditPurchaseModalProps } from './types'

export function CreditPurchaseModal(props: CreditPurchaseModalProps) {
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

    const { t } = useTheme()
    const { t: translate, locale } = useI18n()
    const effectiveStep = step
    const livePayment =
        step === 3 &&
        (payment?.status === 'pending' || payment?.status === 'approved')

    const parsedQuantity = Number.parseInt(creditQuantity, 10)
    const quantity =
        Number.isFinite(parsedQuantity) && parsedQuantity > 0
            ? parsedQuantity
            : 1
    const unitAmountCents = payment?.unitAmountCents ?? 400
    const totalAmountCents =
        payment?.transactionAmountCents ?? quantity * unitAmountCents
    const amountLabel = payment
        ? formatCurrency(payment.transactionAmountCents, locale)
        : formatCurrency(totalAmountCents, locale)
    const unitAmountLabel = formatCurrency(unitAmountCents, locale)
    const paymentExpiresAt = formatDate(payment?.paymentExpiresAt, locale)

    return (
        <AppModal visible={visible} onClose={onClose}>
            <CreditPurchaseModalHeader onClose={onClose} />

            <CreditPurchaseStepIndicator step={effectiveStep} />

            {isLoading && !livePayment ? (
                <CreditPurchaseLoadingState />
            ) : (
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 8 }}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    keyboardShouldPersistTaps='handled'
                >
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 14,
                            lineHeight: 22,
                            marginBottom: 16,
                        }}
                    >
                        {translate('creditCheckout.description')}
                    </Text>

                    {effectiveStep === 1 ? (
                        <CreditPurchaseQuantityStep
                            creditQuantity={creditQuantity}
                            unitAmountLabel={unitAmountLabel}
                            totalAmountLabel={amountLabel}
                            onCreditQuantityChange={onCreditQuantityChange}
                            onContinue={onContinue}
                        />
                    ) : null}

                    {effectiveStep === 2 ? (
                        <CreditPurchaseDocumentStep
                            quantity={quantity}
                            amountLabel={amountLabel}
                            documentNumber={documentNumber}
                            isCreatingCheckout={isCreatingCheckout}
                            onDocumentNumberChange={onDocumentNumberChange}
                            onBack={onBack}
                            onGenerateCheckout={onGenerateCheckout}
                        />
                    ) : null}

                    {effectiveStep === 3 && payment ? (
                        <CreditPurchasePaymentStep
                            payment={payment}
                            amountLabel={amountLabel}
                            paymentExpiresAt={paymentExpiresAt}
                            isRefreshingStatus={isRefreshingStatus}
                            onRefreshStatus={onRefreshStatus}
                        />
                    ) : null}

                    {errorMessage ? (
                        <CreditPurchaseErrorMessage message={errorMessage} />
                    ) : null}
                </ScrollView>
            )}
        </AppModal>
    )
}
