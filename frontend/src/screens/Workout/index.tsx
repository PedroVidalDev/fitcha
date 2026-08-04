import { AddMachineModal } from '@/src/components/AddMachineModal'
import { useState } from 'react'
import { Animated as RNAnimated, ScrollView, Text, View } from 'react-native'
import { useI18n } from '../../contexts/I18nContext'
import { useTheme } from '../../contexts/ThemeContext'
import { WorkoutConfirmModal } from './components/WorkoutConfirmModal'
import { WorkoutDurationCard } from './components/WorkoutDurationCard'
import { WorkoutFooterActions } from './components/WorkoutFooterActions'
import { WorkoutHeader } from './components/WorkoutHeader'
import { WorkoutLoadingState } from './components/WorkoutLoadingState'
import { WorkoutMachineHero } from './components/WorkoutMachineHero'
import { WorkoutMachineNavigator } from './components/WorkoutMachineNavigator'
import { WorkoutPrCelebration } from './components/WorkoutPrCelebration'
import { WorkoutRestTimerCard } from './components/WorkoutRestTimerCard'
import { WorkoutSeriesList } from './components/WorkoutSeriesList'
import { type WorkoutScreenProps } from './types'
import { useWorkoutScreen } from './useWorkoutScreen'

export default function WorkoutScreen(props: WorkoutScreenProps) {
    const { t } = useTheme()
    const { t: translate } = useI18n()
    const {
        machine,
        isLoading,
        currentIdx,
        elapsed,
        completedCount,
        restStartedAt,
        restElapsed,
        canGoPrev,
        canGoNext,
        isLast,
        modal,
        prCelebration,
        machineProgressItems,
        seriesFields,
        durationConfig,
        hasLockedSeries,
        fadeAnim,
        slideAnim,
        machineNavScrollRef,
        handleCloseModal,
        handlePrCelebrationFinished,
        handleModalConfirm,
        handleQuit,
        handlePreviousMachine,
        handleNextMachine,
        handleNext,
        handleAddTemporaryMachine,
        handleReplaceCurrentMachine,
        canReplaceCurrentMachine,
        sessionCatalogMachineIds,
        handleRemoveMachine,
        handleSelectMachine,
        handleUpdateDraftField,
        handleConfirmDraftField,
        handleDurationAction,
    } = useWorkoutScreen(props)
    const [isAddMachineModalVisible, setIsAddMachineModalVisible] =
        useState(false)
    const [isReplaceMachineModalVisible, setIsReplaceMachineModalVisible] =
        useState(false)

    if (isLoading) {
        return <WorkoutLoadingState />
    }

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <WorkoutHeader
                elapsed={elapsed}
                currentPosition={machine ? currentIdx + 1 : 0}
                totalMachines={machineProgressItems.length}
                completedCount={completedCount}
                onQuit={handleQuit}
            />

            <WorkoutMachineNavigator
                machineNavScrollRef={machineNavScrollRef}
                items={machineProgressItems}
                canGoPrev={canGoPrev}
                canGoNext={canGoNext}
                canRemoveMachine={!!machine}
                canReplaceMachine={canReplaceCurrentMachine}
                onPressPrevious={handlePreviousMachine}
                onPressNext={handleNextMachine}
                onPressAddMachine={() => setIsAddMachineModalVisible(true)}
                onPressRemoveMachine={handleRemoveMachine}
                onPressReplaceMachine={() =>
                    setIsReplaceMachineModalVisible(true)
                }
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
                    {machine ? (
                        <>
                            <WorkoutMachineHero machine={machine} />

                            <WorkoutRestTimerCard
                                restStartedAt={restStartedAt}
                                restElapsed={restElapsed}
                            />

                            {machine.trackingType === 'duration' &&
                            durationConfig ? (
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
                        </>
                    ) : (
                        <View style={{ paddingVertical: 48 }}>
                            <Text
                                style={{
                                    color: t.textMuted,
                                    fontSize: 15,
                                    fontWeight: '700',
                                    textAlign: 'center',
                                    lineHeight: 22,
                                }}
                            >
                                {translate('workout.emptySession')}
                            </Text>
                        </View>
                    )}
                </RNAnimated.View>
            </ScrollView>

            <WorkoutConfirmModal
                modal={modal}
                onClose={handleCloseModal}
                onConfirm={handleModalConfirm}
            />

            <AddMachineModal
                visible={isAddMachineModalVisible}
                onClose={() => setIsAddMachineModalVisible(false)}
                onAdd={handleAddTemporaryMachine}
            />

            <AddMachineModal
                visible={isReplaceMachineModalVisible}
                onClose={() => setIsReplaceMachineModalVisible(false)}
                onAdd={handleReplaceCurrentMachine}
                substitutionGroup={machine?.substitutionGroup}
                excludedMachineIds={sessionCatalogMachineIds.filter(
                    (id) => id !== machine?.catalogMachineId,
                )}
                hideCategoryFilters
                titleKey='workout.replaceMachine.title'
                actionLabelKey='workout.replaceMachine.confirm'
            />

            <WorkoutPrCelebration
                celebration={prCelebration}
                onFinished={handlePrCelebrationFinished}
            />
        </View>
    )
}
