import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback } from 'react'
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useCreditCheckout } from '../../hooks/useCreditCheckout'
import { ProfileCreditsModal } from './components/ProfileCreditsModal'
import { ProfileCreditsSection } from './components/ProfileCreditsSection'
import { ProfileCard } from './components/ProfileCard'
import { ProfileHeaderCard } from './components/ProfileHeaderCard'
import { ProfileLanguageSection } from './components/ProfileLanguageSection'
import { ProfilePasswordSection } from './components/ProfilePasswordSection'
import { ProfileSectionHeading } from './components/ProfileSectionHeading'
import { formatDate } from './helpers'
import { useProfileForm } from './hooks/useProfileForm'
import { type ProfileScreenProps } from './types'

export default function ProfileScreen(props: ProfileScreenProps) {
    void props

    const { t: theme, toggle } = useTheme()
    const { user, changePassword, logout } = useAuth()
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

                        <ProfileLanguageSection
                            locale={locale}
                            onSelectLocale={setLocale}
                        />

                        <ProfileCard>
                            <ProfileSectionHeading
                                title={t('profile.theme.title')}
                                description={t('profile.theme.description')}
                            />

                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={toggle}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        backgroundColor: theme.chipBg,
                                        borderRadius: 16,
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        borderWidth: 0.5,
                                        borderColor: theme.accent,
                                    }}
                                >
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 12,
                                        }}
                                    >
                                        <Ionicons
                                            name={
                                                theme.mode === 'dark'
                                                    ? 'moon'
                                                    : 'sunny'
                                            }
                                            size={22}
                                            color={theme.accent}
                                        />
                                        <Text
                                            style={{
                                                color: theme.textPrimary,
                                                fontSize: 15,
                                                fontWeight: '800',
                                            }}
                                        >
                                            {t(
                                                theme.mode === 'dark'
                                                    ? 'profile.theme.dark'
                                                    : 'profile.theme.light',
                                            )}
                                        </Text>
                                    </View>

                                    <Ionicons
                                        name='swap-horizontal'
                                        size={20}
                                        color={theme.textMuted}
                                    />
                                </View>
                            </TouchableOpacity>
                        </ProfileCard>

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

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => void logout()}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                                borderRadius: 16,
                                paddingVertical: 16,
                                backgroundColor: theme.home.danger + '18',
                                borderWidth: 1,
                                borderColor: theme.home.danger + '70',
                            }}
                        >
                            <Ionicons
                                name='log-out-outline'
                                size={21}
                                color={theme.home.danger}
                            />
                            <Text
                                style={{
                                    color: theme.home.danger,
                                    fontSize: 16,
                                    fontWeight: '900',
                                }}
                            >
                                {t('profile.logout')}
                            </Text>
                        </TouchableOpacity>
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
