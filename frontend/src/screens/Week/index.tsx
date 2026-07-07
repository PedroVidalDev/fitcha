import { useWorkouts } from '@/src/hooks/useWorkouts'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useMemo, useState } from 'react'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'
import { AIWizard } from '../../components/AIWizard'
import { WizardData } from '../../components/AIWizard/types'
import { ConfirmModal } from '../../components/ConfirmModal'
import { CreditPurchaseModal } from '../../components/CreditPurchaseModal'
import { WorkoutFormModal } from '../../components/WorkoutFormModal'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useCreditCheckout } from '../../hooks/useCreditCheckout'
import { generateAIWorkout } from '../../services/aiWorkout'
import { EmptyWorkout } from './components/EmptyWorkout'
import { Workout } from './components/Workout'

export default function WeekScreen() {
    const { t } = useTheme()
    const { t: translate } = useI18n()
    const { user, setCredits } = useAuth()
    const { workouts, createWorkout, refresh } = useWorkouts()
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
    } = useCreditCheckout()

    const [wizardVisible, setWizardVisible] = useState(false)
    const [successVisible, setSuccessVisible] = useState(false)
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)

    const totalMachines = useMemo(
        () =>
            workouts.reduce((sum, workout) => sum + workout.machines.length, 0),
        [workouts],
    )

    useFocusEffect(
        useCallback(() => {
            refresh()
        }, [refresh]),
    )

    const handleGenerateWorkout = useCallback(
        async (wizardData: WizardData) => {
            const response = await generateAIWorkout(wizardData)
            await setCredits(response.remainingCredits)
            await refresh({ forceSync: true })
            setSuccessVisible(true)
        },
        [refresh, setCredits],
    )

    return (
        <View style={{ flex: 1, backgroundColor: t.bg, padding: 16 }}>
            <LinearGradient
                colors={t.gradientHero}
                style={{
                    borderRadius: 22,
                    padding: 18,
                    marginBottom: 18,
                    borderWidth: 1,
                    borderColor: t.border,
                    overflow: 'hidden',
                }}
            >
                <View
                    style={{
                        position: 'absolute',
                        right: -20,
                        top: -26,
                        width: 96,
                        height: 96,
                        borderRadius: 999,
                        backgroundColor: t.chipBg,
                    }}
                />
                <Text
                    style={{
                        color: t.textDim,
                        fontSize: 11,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 2,
                    }}
                >
                    {translate('week.title')}
                </Text>
                <Text
                    style={{
                        color: t.accent,
                        fontSize: 24,
                        fontWeight: '900',
                        marginTop: 8,
                    }}
                >
                    {translate('week.title')}
                </Text>
                <Text
                    style={{
                        color: t.textMuted,
                        fontSize: 13,
                        lineHeight: 19,
                        marginTop: 8,
                    }}
                >
                    {translate('week.summary', {
                        workoutCount: workouts.length,
                        workoutSuffix: workouts.length !== 1 ? 's' : '',
                        machineCount: totalMachines,
                        machineSuffix: totalMachines !== 1 ? 's' : '',
                    })}
                </Text>
            </LinearGradient>

            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsCreateModalVisible(true)}
                style={{ marginBottom: user ? 12 : 16 }}
            >
                <LinearGradient
                    colors={t.gradientAccent}
                    style={{
                        borderRadius: 16,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                    }}
                >
                    <Ionicons name='add-circle' size={22} color={t.btnColor} />
                    <Text
                        style={{
                            color: t.btnColor,
                            fontSize: 16,
                            fontWeight: '900',
                        }}
                    >
                        {translate('workoutForm.createAction')}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>

            {user ? (
                <TouchableOpacity
                    activeOpacity={0.84}
                    onPress={() => setWizardVisible(true)}
                    style={{ marginBottom: 18 }}
                >
                    <LinearGradient
                        colors={t.gradientHero}
                        style={{
                            borderRadius: 18,
                            paddingVertical: 15,
                            paddingHorizontal: 16,
                            borderWidth: 1,
                            borderColor: t.border,
                            overflow: 'hidden',
                        }}
                    >
                        <View
                            style={{
                                position: 'absolute',
                                right: -12,
                                top: -18,
                                width: 74,
                                height: 74,
                                borderRadius: 999,
                                backgroundColor: t.chipBg,
                            }}
                        />

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                            }}
                        >
                            <View
                                style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 14,
                                    backgroundColor: t.inputBg,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Ionicons
                                    name='sparkles'
                                    size={20}
                                    color={t.accent}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        color: t.textDim,
                                        fontSize: 10,
                                        fontWeight: '800',
                                        textTransform: 'uppercase',
                                        letterSpacing: 1.2,
                                    }}
                                >
                                    {translate('aiWizard.badge')}
                                </Text>
                                <Text
                                    style={{
                                        color: t.textPrimary,
                                        fontSize: 16,
                                        fontWeight: '900',
                                        marginTop: 4,
                                    }}
                                >
                                    {translate('week.aiAction')}
                                </Text>
                                <Text
                                    style={{
                                        color: t.textMuted,
                                        fontSize: 13,
                                        lineHeight: 18,
                                        marginTop: 4,
                                    }}
                                >
                                    {translate('week.aiDescription')}
                                </Text>
                            </View>

                            <Ionicons
                                name='chevron-forward'
                                size={18}
                                color={t.textPrimary}
                            />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            ) : null}

            <FlatList
                data={workouts}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<EmptyWorkout />}
                renderItem={({ item: workout, index }) => {
                    return <Workout index={index} workout={workout} />
                }}
            />

            <WorkoutFormModal
                visible={isCreateModalVisible}
                title={translate('workoutForm.createTitle')}
                submitLabel={translate('workoutForm.createAction')}
                onClose={() => setIsCreateModalVisible(false)}
                onSubmit={async (name, description) => {
                    await createWorkout(name, description)
                }}
            />

            <AIWizard
                visible={wizardVisible}
                onClose={() => setWizardVisible(false)}
                onRequestBuyCredits={openModal}
                onFinish={handleGenerateWorkout}
            />

            <CreditPurchaseModal
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

            <ConfirmModal
                visible={successVisible}
                onClose={() => setSuccessVisible(false)}
                onConfirm={() => setSuccessVisible(false)}
                title={translate('week.generated.title')}
                message={translate('week.generated.message')}
                confirmLabel={translate('common.actions.close')}
                hideCancel
                confirmVariant='accent'
            />
        </View>
    )
}
