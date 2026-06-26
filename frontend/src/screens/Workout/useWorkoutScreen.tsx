import { useWorkoutMachines } from '@/src/hooks/useWorkoutMachines'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated as RNAnimated, ScrollView } from 'react-native'
import { useI18n } from '../../contexts/I18nContext'
import {
    clearActiveWorkoutSession,
    getActiveWorkoutSession,
    saveActiveWorkoutSession,
} from '../../services/activeWorkout'
import {
    buildWorkoutResults,
    formatTime,
    getWorkoutDraft,
    hasDraftValue,
    isDraftComplete,
    parseReps,
    parseWeight,
} from './helpers'
import { useSaveWorkout } from './hooks/useSaveWorkout'
import {
    type UseWorkoutScreenParams,
    type WorkoutDraftFieldKey,
    type WorkoutDraftMap,
    type WorkoutMachineProgressItem,
    type WorkoutModalConfig,
    type WorkoutResult,
    type WorkoutSeriesField,
    type WorkoutSetKey,
    WORKOUT_SET_KEYS,
} from './types'

export function useWorkoutScreen(params: UseWorkoutScreenParams) {
    const { navigation, route } = params
    const workoutId = route.params.workoutId
    const shouldResume = !!route.params.resume

    const { t: translate } = useI18n()
    const { machines, refresh, isLoading } = useWorkoutMachines(workoutId)
    const saveWorkout = useSaveWorkout()

    const [currentIdx, setCurrentIdx] = useState(0)
    const [drafts, setDrafts] = useState<WorkoutDraftMap>({})
    const [startedAt, setStartedAt] = useState(() => Date.now())
    const [elapsed, setElapsed] = useState(0)
    const [restStartedAt, setRestStartedAt] = useState<number | null>(null)
    const [restElapsed, setRestElapsed] = useState(0)
    const [modal, setModal] = useState<WorkoutModalConfig | null>(null)
    const [isSessionReady, setIsSessionReady] = useState(!shouldResume)
    const machineNavScrollRef = useRef<ScrollView | null>(null)
    const slideAnim = useRef(new RNAnimated.Value(30)).current
    const fadeAnim = useRef(new RNAnimated.Value(0)).current

    const machine = machines[currentIdx]
    const isLast = currentIdx === machines.length - 1
    const canGoPrev = currentIdx > 0
    const canGoNext = currentIdx < machines.length - 1
    const currentDraft = machine
        ? getWorkoutDraft(drafts[machine.id])
        : getWorkoutDraft()
    const completedCount = machines.filter((item) =>
        isDraftComplete(drafts[item.id]),
    ).length
    const pendingCount = machines.length - completedCount
    const hasAnyDrafts = machines.some((item) => hasDraftValue(drafts[item.id]))
    const currentHasDraft = hasDraftValue(currentDraft)
    const currentIsComplete = isDraftComplete(currentDraft)

    const machineProgressItems: WorkoutMachineProgressItem[] = machines.map(
        (item, index) => ({
            id: item.id,
            position: index + 1,
            isCurrent: index === currentIdx,
            hasDraft: hasDraftValue(drafts[item.id]),
            isComplete: isDraftComplete(drafts[item.id]),
        }),
    )

    const openModal = useCallback((config: WorkoutModalConfig) => {
        setModal(config)
    }, [])

    const closeModal = useCallback(() => {
        setModal(null)
    }, [])

    const handleModalConfirm = useCallback(() => {
        const action = modal?.onConfirm
        closeModal()
        action?.()
    }, [closeModal, modal])

    const clearAndExitWorkout = useCallback(async () => {
        await clearActiveWorkoutSession()
        navigation.goBack()
    }, [navigation])

    const isValidWeightValue = (value: string) => {
        const parsed = parseWeight(value)
        return !Number.isNaN(parsed) && parsed > 0
    }

    const isValidRepsValue = (value: string) => {
        const parsed = parseReps(value)
        return !Number.isNaN(parsed) && parsed > 0
    }

    const updateDraftField = useCallback(
        (
            field: WorkoutSetKey,
            draftField: WorkoutDraftFieldKey,
            value: string,
        ) => {
            if (!machine) return

            setDrafts((prev) => {
                const machineDraft = getWorkoutDraft(prev[machine.id])
                const confirmed = { ...machineDraft.confirmed }

                for (const key of WORKOUT_SET_KEYS.slice(
                    WORKOUT_SET_KEYS.indexOf(field),
                )) {
                    confirmed[key] = false
                }

                return {
                    ...prev,
                    [machine.id]: {
                        ...machineDraft,
                        sets: {
                            ...machineDraft.sets,
                            [field]: {
                                ...machineDraft.sets[field],
                                [draftField]: value,
                            },
                        },
                        confirmed,
                    },
                }
            })
        },
        [machine],
    )

    const confirmDraftField = useCallback(
        (field: WorkoutSetKey) => {
            if (!machine) return

            const machineDraft = getWorkoutDraft(drafts[machine.id])
            const currentSet = machineDraft.sets[field]

            if (
                !isValidWeightValue(currentSet.weight) ||
                !isValidRepsValue(currentSet.reps)
            ) {
                return
            }

            const fieldIndex = WORKOUT_SET_KEYS.indexOf(field)
            const previousFields = WORKOUT_SET_KEYS.slice(0, fieldIndex)
            const canConfirm = previousFields.every(
                (key) => machineDraft.confirmed[key],
            )

            if (!canConfirm) return

            const normalizedSet = {
                weight: currentSet.weight.trim(),
                reps: currentSet.reps.trim(),
            }

            setDrafts((prev) => {
                const nextDraft = getWorkoutDraft(prev[machine.id])

                return {
                    ...prev,
                    [machine.id]: {
                        ...nextDraft,
                        sets: {
                            ...nextDraft.sets,
                            [field]: normalizedSet,
                        },
                        confirmed: {
                            ...nextDraft.confirmed,
                            [field]: true,
                        },
                    },
                }
            })

            setRestStartedAt(Date.now())
            setRestElapsed(0)
        },
        [drafts, machine],
    )

    const goToMachine = useCallback(
        (index: number) => {
            if (index < 0 || index >= machines.length || index === currentIdx) {
                return
            }

            setCurrentIdx(index)
        },
        [currentIdx, machines.length],
    )

    const goToPreviousMachine = useCallback(() => {
        if (!canGoPrev) return
        setCurrentIdx((prev) => prev - 1)
    }, [canGoPrev])

    const goToNextMachine = useCallback(() => {
        if (!canGoNext) return
        setCurrentIdx((prev) => prev + 1)
    }, [canGoNext])

    const buildResults = useCallback(
        (): WorkoutResult[] =>
            buildWorkoutResults(
                machines.map((item) => item.id),
                drafts,
            ),
        [drafts, machines],
    )

    const showSavedWorkoutModal = useCallback(
        (finalResults: WorkoutResult[]) => {
            openModal({
                title: translate('workout.saved.title'),
                message: translate('workout.saved.message', {
                    count: finalResults.length,
                    machineSuffix: finalResults.length > 1 ? 's' : '',
                    registeredSuffix: finalResults.length > 1 ? 's' : '',
                    elapsed: formatTime(elapsed),
                }),
                confirmLabel: translate('common.actions.close'),
                hideCancel: true,
                confirmVariant: 'accent',
                onConfirm: () => navigation.goBack(),
            })
        },
        [elapsed, navigation, openModal, translate],
    )

    const showEmptyWorkoutModal = useCallback(() => {
        openModal({
            title: translate('workout.empty.title'),
            message: translate('workout.empty.message'),
            confirmLabel: translate('common.actions.close'),
            hideCancel: true,
            confirmVariant: 'accent',
            onConfirm: () => {
                void clearAndExitWorkout()
            },
        })
    }, [clearAndExitWorkout, openModal, translate])

    const showSaveErrorModal = useCallback(() => {
        openModal({
            title: translate('workout.error.title'),
            message: translate('workout.error.message'),
            confirmLabel: translate('common.actions.close'),
            hideCancel: true,
            confirmVariant: 'accent',
            onConfirm: () => {},
        })
    }, [openModal, translate])

    const finishWorkout = useCallback(
        async (finalResults: WorkoutResult[]) => {
            if (finalResults.length === 0) {
                showEmptyWorkoutModal()
                return
            }

            try {
                await saveWorkout(finalResults)
                await clearActiveWorkoutSession()
                showSavedWorkoutModal(finalResults)
            } catch {
                showSaveErrorModal()
            }
        },
        [
            saveWorkout,
            showEmptyWorkoutModal,
            showSavedWorkoutModal,
            showSaveErrorModal,
        ],
    )

    const handleFinish = useCallback(() => {
        const finalResults = buildResults()

        if (finalResults.length === 0 && hasAnyDrafts) {
            openModal({
                title: translate('workout.incomplete.title'),
                message: translate('workout.incomplete.message'),
                confirmLabel: translate('workout.incomplete.confirm'),
                confirmVariant: 'danger',
                onConfirm: () => {
                    void clearAndExitWorkout()
                },
            })
            return
        }

        if (pendingCount > 0 && finalResults.length > 0) {
            openModal({
                title: translate('workout.pending.title'),
                message: translate('workout.pending.message', {
                    count: pendingCount,
                    machineSuffix: pendingCount > 1 ? 's ficaram' : ' ficou',
                }),
                confirmLabel: translate('common.actions.finish'),
                confirmVariant: 'accent',
                onConfirm: () => {
                    void finishWorkout(finalResults)
                },
            })
            return
        }

        void finishWorkout(finalResults)
    }, [
        buildResults,
        clearAndExitWorkout,
        finishWorkout,
        hasAnyDrafts,
        openModal,
        pendingCount,
        translate,
    ])

    const handleNext = useCallback(() => {
        if (isLast) {
            handleFinish()
            return
        }

        goToNextMachine()
    }, [goToNextMachine, handleFinish, isLast])

    const handleQuit = useCallback(() => {
        openModal({
            title: translate('workout.quit.title'),
            message: translate('workout.quit.message'),
            confirmLabel: translate('workout.quit.confirm'),
            confirmVariant: 'danger',
            onConfirm: () => {
                void clearAndExitWorkout()
            },
        })
    }, [clearAndExitWorkout, openModal, translate])

    useEffect(() => {
        let isCancelled = false

        const hydrateSession = async () => {
            if (!shouldResume) {
                setCurrentIdx(0)
                setDrafts({})
                setStartedAt(Date.now())
                setRestStartedAt(null)
                setRestElapsed(0)
                setIsSessionReady(true)
                return
            }

            const session = await getActiveWorkoutSession()
            if (isCancelled) return

            if (session && session.workoutId === workoutId) {
                setCurrentIdx(session.currentIdx)
                setDrafts(session.drafts)
                setStartedAt(session.startedAt)
                setRestStartedAt(session.restStartedAt)
                setRestElapsed(0)
            } else {
                setCurrentIdx(0)
                setDrafts({})
                setStartedAt(Date.now())
                setRestStartedAt(null)
                setRestElapsed(0)
            }

            setIsSessionReady(true)
        }

        void hydrateSession()

        return () => {
            isCancelled = true
        }
    }, [shouldResume, workoutId])

    useEffect(() => {
        if (!isSessionReady) return

        void saveActiveWorkoutSession({
            workoutId,
            currentIdx,
            drafts,
            startedAt,
            restStartedAt,
        })
    }, [
        currentIdx,
        drafts,
        isSessionReady,
        restStartedAt,
        startedAt,
        workoutId,
    ])

    useEffect(() => {
        const syncTimers = () => {
            setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)))

            if (!restStartedAt) {
                setRestElapsed(0)
                return
            }

            setRestElapsed(Math.floor((Date.now() - restStartedAt) / 1000))
        }

        syncTimers()
        const interval = setInterval(syncTimers, 1000)

        return () => clearInterval(interval)
    }, [restStartedAt, startedAt])

    useEffect(() => {
        slideAnim.setValue(30)
        fadeAnim.setValue(0)
        RNAnimated.parallel([
            RNAnimated.spring(slideAnim, {
                toValue: 0,
                tension: 60,
                friction: 9,
                useNativeDriver: true,
            }),
            RNAnimated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start()
    }, [currentIdx, fadeAnim, slideAnim])

    useEffect(() => {
        if (machines.length === 0) return
        if (currentIdx >= machines.length) {
            setCurrentIdx(machines.length - 1)
        }
    }, [currentIdx, machines.length])

    useEffect(() => {
        machineNavScrollRef.current?.scrollTo({
            x: Math.max(currentIdx * 72 - 72, 0),
            animated: true,
        })
    }, [currentIdx])

    useFocusEffect(
        useCallback(() => {
            void refresh()
        }, [refresh]),
    )

    const seriesFields: WorkoutSeriesField[] = machine
        ? [
              {
                  key: 'set1' as const,
                  label: translate('workout.series.one'),
                  weightValue: currentDraft.sets.set1.weight,
                  repsValue: currentDraft.sets.set1.reps,
                  weightPlaceholder:
                      machine.recordSets?.[0]?.weight?.toString() ?? '',
                  repsPlaceholder:
                      machine.recordSets?.[0]?.reps &&
                      machine.recordSets[0].reps > 0
                          ? machine.recordSets[0].reps.toString()
                          : '',
              },
              {
                  key: 'set2' as const,
                  label: translate('workout.series.two'),
                  weightValue: currentDraft.sets.set2.weight,
                  repsValue: currentDraft.sets.set2.reps,
                  weightPlaceholder:
                      machine.recordSets?.[1]?.weight?.toString() ?? '',
                  repsPlaceholder:
                      machine.recordSets?.[1]?.reps &&
                      machine.recordSets[1].reps > 0
                          ? machine.recordSets[1].reps.toString()
                          : '',
              },
              {
                  key: 'set3' as const,
                  label: translate('workout.series.three'),
                  weightValue: currentDraft.sets.set3.weight,
                  repsValue: currentDraft.sets.set3.reps,
                  weightPlaceholder:
                      machine.recordSets?.[2]?.weight?.toString() ?? '',
                  repsPlaceholder:
                      machine.recordSets?.[2]?.reps &&
                      machine.recordSets[2].reps > 0
                          ? machine.recordSets[2].reps.toString()
                          : '',
              },
          ].map((item, index, allFields) => {
              const previousSetsComplete =
                  index === 0 ||
                  allFields
                      .slice(0, index)
                      .every((field) => currentDraft.confirmed[field.key])
              const isConfirmed = currentDraft.confirmed[item.key]
              const isWeightValid = isValidWeightValue(item.weightValue)
              const isRepsValid = isValidRepsValue(item.repsValue)

              return {
                  ...item,
                  isConfirmed,
                  isLocked: !previousSetsComplete,
                  canConfirm:
                      previousSetsComplete &&
                      isWeightValid &&
                      isRepsValid &&
                      !isConfirmed,
              }
          })
        : []

    const hasLockedSeries = seriesFields.slice(1).some((item) => item.isLocked)

    return {
        machine,
        isLoading: !isSessionReady || isLoading,
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
        hasLockedSeries,
        fadeAnim,
        slideAnim,
        machineNavScrollRef,
        handleCloseModal: closeModal,
        handleModalConfirm,
        handleQuit,
        handlePreviousMachine: goToPreviousMachine,
        handleNextMachine: goToNextMachine,
        handleNext,
        handleSelectMachine: goToMachine,
        handleUpdateDraftField: updateDraftField,
        handleConfirmDraftField: confirmDraftField,
    }
}
