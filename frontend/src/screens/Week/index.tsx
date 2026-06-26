import { useWorkouts } from '@/src/hooks/useWorkouts'
import { RootStackParamList } from '@/src/router/types'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useLayoutEffect, useMemo, useState } from 'react'
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
import { syncWorkoutData } from '../../services/workoutData'
import { EmptyWorkout } from './components/EmptyWorkout'
import { Workout } from './components/Workout'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Week'>

export default function WeekScreen() {
    const { t } = useTheme()
    const { t: translate } = useI18n()
    const { user, setCredits } = useAuth()
    const navigation = useNavigation<Nav>()
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

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: user
                ? () => (
                      <TouchableOpacity
                          onPress={() => setWizardVisible(true)}
                          style={{ padding: 6 }}
                      >
                          <Ionicons
                              name='sparkles'
                              size={22}
                              color={t.accent}
                          />
                      </TouchableOpacity>
                  )
                : undefined,
        })
    }, [navigation, t.accent, user])

    useFocusEffect(
        useCallback(() => {
            refresh()
        }, [refresh]),
    )

    const handleGenerateWorkout = useCallback(
        async (wizardData: WizardData) => {
            const response = await generateAIWorkout(wizardData)
            await syncWorkoutData()
            await setCredits(response.remainingCredits)
            await refresh()
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
                        color: t.textPrimary,
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
                style={{ marginBottom: 16 }}
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
                    <Ionicons
                        name='add-circle'
                        size={22}
                        color={t.mode === 'dark' ? '#0d0500' : '#FFF'}
                    />
                    <Text
                        style={{
                            color: t.mode === 'dark' ? '#0d0500' : '#FFF',
                            fontSize: 16,
                            fontWeight: '900',
                        }}
                    >
                        {translate('workoutForm.createAction')}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>

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
