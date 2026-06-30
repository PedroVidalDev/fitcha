import { Animated as RNAnimated, ScrollView, View } from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'
import { WorkoutConfirmModal } from './components/WorkoutConfirmModal'
import { WorkoutDurationCard } from './components/WorkoutDurationCard'
import { WorkoutFooterActions } from './components/WorkoutFooterActions'
import { WorkoutHeader } from './components/WorkoutHeader'
import { WorkoutLoadingState } from './components/WorkoutLoadingState'
import { WorkoutMachineHero } from './components/WorkoutMachineHero'
import { WorkoutMachineNavigator } from './components/WorkoutMachineNavigator'
import { WorkoutMachineStatusCard } from './components/WorkoutMachineStatusCard'
import { WorkoutRestTimerCard } from './components/WorkoutRestTimerCard'
import { WorkoutSeriesList } from './components/WorkoutSeriesList'
import { type WorkoutScreenProps } from './types'
import { useWorkoutScreen } from './useWorkoutScreen'

export default function WorkoutScreen(props: WorkoutScreenProps) {
    const { t } = useTheme()
    const {
        machine,
        isLoading,
        currentIdx,
        elapsed,
        completedCount,
        currentHasDraft,
        currentIsComplete,
        restStartedAt,
        restElapsed,
        canGoPrev,
        canGoNext,
        isLast,
        modal,
        machineProgressItems,
        seriesFields,
        durationConfig,
        hasLockedSeries,
        fadeAnim,
        slideAnim,
        machineNavScrollRef,
        handleCloseModal,
        handleModalConfirm,
        handleQuit,
        handlePreviousMachine,
        handleNextMachine,
        handleNext,
        handleSelectMachine,
        handleUpdateDraftField,
        handleConfirmDraftField,
        handleDurationAction,
    } = useWorkoutScreen(props)

    if (isLoading) {
        return <WorkoutLoadingState />
    }

    if (!machine) {
        return null
    }

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <WorkoutHeader
                elapsed={elapsed}
                currentPosition={currentIdx + 1}
                totalMachines={machineProgressItems.length}
                completedCount={completedCount}
                onQuit={handleQuit}
            />

            <WorkoutMachineNavigator
                machineNavScrollRef={machineNavScrollRef}
                items={machineProgressItems}
                canGoPrev={canGoPrev}
                canGoNext={canGoNext}
                onPressPrevious={handlePreviousMachine}
                onPressNext={handleNextMachine}
                onSelectMachine={handleSelectMachine}
            />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps='handled'
            >
                <RNAnimated.View
                    style={{
                        padding: 20,
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }}
                >
                    <WorkoutMachineHero machine={machine} />

                    <WorkoutMachineStatusCard
                        currentHasDraft={currentHasDraft}
                        currentIsComplete={currentIsComplete}
                    />

                    <WorkoutRestTimerCard
                        restStartedAt={restStartedAt}
                        restElapsed={restElapsed}
                    />

                    {machine.trackingType === 'duration' && durationConfig ? (
                        <WorkoutDurationCard
                            config={durationConfig}
                            onAction={handleDurationAction}
                        />
                    ) : (
                        <WorkoutSeriesList
                            machineId={machine.id}
                            items={seriesFields}
                            hasLockedSeries={hasLockedSeries}
                            onChangeField={handleUpdateDraftField}
                            onConfirmField={handleConfirmDraftField}
                        />
                    )}

                    <WorkoutFooterActions
                        canGoBack={canGoPrev}
                        isLast={isLast}
                        onPressBack={handlePreviousMachine}
                        onPressNext={handleNext}
                    />
                </RNAnimated.View>
            </ScrollView>

            <WorkoutConfirmModal
                modal={modal}
                onClose={handleCloseModal}
                onConfirm={handleModalConfirm}
            />
        </View>
    )
}
