import { useFocusEffect } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback } from 'react'
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    View,
} from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useCreditCheckout } from '../../hooks/useCreditCheckout'
import { ProfileAccountSection } from './components/ProfileAccountSection'
import { ProfileCreditsModal } from './components/ProfileCreditsModal'
import { ProfileCreditsSection } from './components/ProfileCreditsSection'
import { ProfileHeaderCard } from './components/ProfileHeaderCard'
import { ProfileLanguageSection } from './components/ProfileLanguageSection'
import { ProfilePasswordSection } from './components/ProfilePasswordSection'
import { formatDate } from './helpers'
import { useProfileForm } from './hooks/useProfileForm'
import { type ProfileScreenProps } from './types'

export default function ProfileScreen(props: ProfileScreenProps) {
    void props

    const { t: theme } = useTheme()
    const { user, changePassword } = useAuth()
    const { locale, setLocale, t } = useI18n()

    const { values, errors, isSubmitting, setField, handleSubmit } =
        useProfileForm({
            user,
            onSubmitPasswordChange: changePassword,
        })

    const {
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
        reloadSummary,
    } = useCreditCheckout({
        autoLoad: true,
    })

    useFocusEffect(
        useCallback(() => {
            void reloadSummary()
        }, [reloadSummary]),
    )

    const handleSaveProfile = useCallback(async () => {
        const saved = await handleSubmit()
        if (!saved) return

        Alert.alert(
            t('profile.alert.savedTitle'),
            t('profile.alert.savedMessage'),
        )
    }, [handleSubmit, t])

    if (!user) return null

    const paymentExpiresAt = formatDate(payment?.paymentExpiresAt, locale)
    const hasPendingPayment = payment?.status === 'pending'

    return (
        <LinearGradient colors={theme.gradientHero} style={{ flex: 1 }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps='handled'
                >
                    <View style={{ gap: 18 }}>
                        <ProfileHeaderCard name={user.name} />

                        <ProfileAccountSection
                            name={user.name}
                            email={user.email}
                        />

                        <ProfileLanguageSection
                            locale={locale}
                            onSelectLocale={setLocale}
                        />

                        <ProfileCreditsSection
                            credits={user.credits}
                            payment={payment}
                            paymentExpiresAt={paymentExpiresAt}
                            hasPendingPayment={hasPendingPayment}
                            isLoading={isLoading}
                            onOpenModal={openModal}
                        />

                        <ProfilePasswordSection
                            values={values}
                            errors={errors}
                            isSubmitting={isSubmitting}
                            setField={setField}
                            onSave={handleSaveProfile}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <ProfileCreditsModal
                visible={isModalVisible}
                step={step}
                payment={payment}
                creditQuantity={creditQuantity}
                documentNumber={documentNumber}
                isLoading={isLoading}
                isCreatingCheckout={isCreatingCheckout}
                isRefreshingStatus={isRefreshingStatus}
                errorMessage={errorMessage}
                onClose={closeModal}
                onCreditQuantityChange={setCreditQuantity}
                onDocumentNumberChange={setDocumentNumber}
                onContinue={goToDocumentStep}
                onBack={goBackStep}
                onGenerateCheckout={() => void generateCheckout()}
                onRefreshStatus={() => void refreshStatus()}
            />
        </LinearGradient>
    )
}
