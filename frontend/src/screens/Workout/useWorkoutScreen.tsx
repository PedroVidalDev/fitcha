import { useWorkoutMachines } from '@/src/hooks/useWorkoutMachines'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated as RNAnimated, ScrollView } from 'react-native'
import { useI18n } from '../../contexts/I18nContext'
import { type CatalogMachine } from '../../dtos/CatalogMachine'
import {
    clearActiveWorkoutSession,
    getActiveWorkoutSession,
    saveActiveWorkoutSession,
} from '../../services/activeWorkout'
import {
    buildWorkoutResults,
    formatTime,
    getDurationElapsedSeconds,
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
    type WorkoutDurationConfig,
    type WorkoutDraftMap,
    type WorkoutMachineProgressItem,
    type WorkoutModalConfig,
    type WorkoutResult,
    type WorkoutSeriesField,
    type WorkoutSetKey,
    type TemporaryWorkoutMachine,
    type WorkoutMachine,
    WORKOUT_SET_KEYS,
} from './types'

function createTemporaryMachine(
    catalogMachine: CatalogMachine,
    replacesMachineId?: string,
): TemporaryWorkoutMachine {
    return {
        id: `temporary:${catalogMachine.id}`,
        catalogMachineId: catalogMachine.id,
        isTemporary: true,
        ...(replacesMachineId ? { replacesMachineId } : {}),
        name: catalogMachine.name,
        description: catalogMachine.description,
        photo: catalogMachine.photo,
        categoryKey: catalogMachine.categoryKey,
        substitutionGroup: catalogMachine.substitutionGroup,
        trackingType: catalogMachine.trackingType,
        requiresWeight: catalogMachine.requiresWeight,
        lastWeight: null,
        lastSets: null,
        recordSets: null,
    }
}

export function useWorkoutScreen(params: UseWorkoutScreenParams) {
    const { navigation, route } = params
    const workoutId = route.params.workoutId
    const shouldResume = !!route.params.resume

    const { t: translate } = useI18n()
    const { machines, refresh, isLoading } = useWorkoutMachines(workoutId)
    const saveWorkout = useSaveWorkout()

    const [currentIdx, setCurrentIdx] = useState(0)
    const [drafts, setDrafts] = useState<WorkoutDraftMap>({})
    const [temporaryMachines, setTemporaryMachines] = useState<
        TemporaryWorkoutMachine[]
    >([])
    const [removedMachineIds, setRemovedMachineIds] = useState<string[]>([])
    const [startedAt, setStartedAt] = useState(() => Date.now())
    const [elapsed, setElapsed] = useState(0)
    const [restStartedAt, setRestStartedAt] = useState<number | null>(null)
    const [restElapsed, setRestElapsed] = useState(0)
    const [modal, setModal] = useState<WorkoutModalConfig | null>(null)
    const [isSessionReady, setIsSessionReady] = useState(!shouldResume)
    const machineNavScrollRef = useRef<ScrollView | null>(null)
    const slideAnim = useRef(new RNAnimated.Value(30)).current
    const fadeAnim = useRef(new RNAnimated.Value(0)).current

    const sessionMachines = useMemo<WorkoutMachine[]>(() => {
        const replacements = new Map(
            temporaryMachines
                .filter((item) => !!item.replacesMachineId)
                .map((item) => [item.replacesMachineId, item]),
        )
        const plannedMachines = machines.reduce<WorkoutMachine[]>(
            (session, plannedMachine) => {
                const replacement = replacements.get(plannedMachine.id)
                if (replacement) {
                    session.push(replacement)
                } else if (!removedMachineIds.includes(plannedMachine.id)) {
                    session.push(plannedMachine)
                }
                return session
            },
            [],
        )
        const addedMachines = temporaryMachines.filter(
            (item) => !item.replacesMachineId,
        )

        return [...plannedMachines, ...addedMachines]
    }, [machines, removedMachineIds, temporaryMachines])
    const machine = sessionMachines[currentIdx]
    const isLast = currentIdx === sessionMachines.length - 1
    const canGoPrev = currentIdx > 0
    const canGoNext = currentIdx < sessionMachines.length - 1
    const currentDraft = machine
        ? getWorkoutDraft(drafts[machine.id])
        : getWorkoutDraft()
    const completedCount = sessionMachines.filter((item) =>
        isDraftComplete(item, drafts[item.id]),
    ).length
    const pendingCount = sessionMachines.length - completedCount
    const hasAnyDrafts = sessionMachines.some((item) =>
        hasDraftValue(item, drafts[item.id]),
    )

    const machineProgressItems: WorkoutMachineProgressItem[] =
        sessionMachines.map((item, index) => ({
            id: item.id,
            position: index + 1,
            isCurrent: index === currentIdx,
            hasDraft: hasDraftValue(item, drafts[item.id]),
            isComplete: isDraftComplete(item, drafts[item.id]),
        }))

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
            if (!machine || machine.trackingType !== 'sets') return

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
            if (!machine || machine.trackingType !== 'sets') return

            const machineDraft = getWorkoutDraft(drafts[machine.id])
            const currentSet = machineDraft.sets[field]

            if (
                (machine.requiresWeight &&
                    !isValidWeightValue(currentSet.weight)) ||
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

    const handleDurationAction = useCallback(() => {
        if (!machine || machine.trackingType !== 'duration') return

        const now = Date.now()
        const draft = getWorkoutDraft(drafts[machine.id])
        const isRunning = draft.duration.startedAt !== null

        setDrafts((prev) => {
            const nextDraft = getWorkoutDraft(prev[machine.id])

            if (nextDraft.duration.startedAt !== null) {
                const elapsedSeconds = getDurationElapsedSeconds(nextDraft)

                return {
                    ...prev,
                    [machine.id]: {
                        ...nextDraft,
                        duration: {
                            startedAt: null,
                            accumulatedSeconds: elapsedSeconds,
                        },
                    },
                }
            }

            return {
                ...prev,
                [machine.id]: {
                    ...nextDraft,
                    duration: {
                        startedAt: now,
                        accumulatedSeconds: 0,
                    },
                },
            }
        })

        if (isRunning) {
            setRestStartedAt(now)
            setRestElapsed(0)
            return
        }

        setRestStartedAt(null)
        setRestElapsed(0)
    }, [drafts, machine])

    const goToMachine = useCallback(
        (index: number) => {
            if (
                index < 0 ||
                index >= sessionMachines.length ||
                index === currentIdx
            ) {
                return
            }

            setCurrentIdx(index)
        },
        [currentIdx, sessionMachines.length],
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
        (): WorkoutResult[] => buildWorkoutResults(sessionMachines, drafts),
        [drafts, sessionMachines],
    )

    const handleAddTemporaryMachine = useCallback(
        (catalogMachine: CatalogMachine) => {
            const alreadyInSession = sessionMachines.some(
                (item) => item.catalogMachineId === catalogMachine.id,
            )
            if (alreadyInSession) return

            const temporaryMachine = createTemporaryMachine(catalogMachine)

            setTemporaryMachines((previous) => [...previous, temporaryMachine])
            setCurrentIdx(sessionMachines.length)
        },
        [sessionMachines],
    )

    const handleReplaceCurrentMachine = useCallback(
        (catalogMachine: CatalogMachine) => {
            if (
                !machine ||
                !machine.substitutionGroup ||
                machine.substitutionGroup !==
                    catalogMachine.substitutionGroup ||
                hasDraftValue(machine, drafts[machine.id])
            ) {
                return
            }

            const temporaryMachine = createTemporaryMachine(
                catalogMachine,
                machine.isTemporary ? machine.replacesMachineId : machine.id,
            )

            if (machine.isTemporary) {
                setTemporaryMachines((previous) =>
                    previous.map((item) =>
                        item.id === machine.id ? temporaryMachine : item,
                    ),
                )
            } else {
                setTemporaryMachines((previous) => [
                    ...previous,
                    temporaryMachine,
                ])
                setRemovedMachineIds((previous) => [...previous, machine.id])
            }
        },
        [drafts, machine],
    )

    const removeCurrentMachine = useCallback(() => {
        if (!machine) return

        const remainingCount = sessionMachines.length - 1
        if (machine.isTemporary) {
            setTemporaryMachines((previous) =>
                previous.filter((item) => item.id !== machine.id),
            )
        } else {
            setRemovedMachineIds((previous) => [...previous, machine.id])
        }
        setDrafts((previous) => {
            const remainingDrafts = { ...previous }
            delete remainingDrafts[machine.id]
            return remainingDrafts
        })
        setRestStartedAt(null)
        setRestElapsed(0)

        if (remainingCount === 0) {
            setCurrentIdx(0)
            return
        }

        if (currentIdx >= remainingCount) {
            setCurrentIdx(remainingCount - 1)
        }
    }, [currentIdx, machine, sessionMachines.length])

    const handleRemoveMachine = useCallback(() => {
        if (!machine) return

        openModal({
            title: translate('workout.removeMachine.title'),
            message: translate('workout.removeMachine.message', {
                name: machine.name,
            }),
            confirmLabel: translate('workout.removeMachine.confirm'),
            confirmVariant: 'danger',
            onConfirm: removeCurrentMachine,
        })
    }, [machine, openModal, removeCurrentMachine, translate])

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
                message: translate('workout.pending.message'),
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
                setTemporaryMachines([])
                setRemovedMachineIds([])
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
                setTemporaryMachines(session.temporaryMachines)
                setRemovedMachineIds(session.removedMachineIds)
                setStartedAt(session.startedAt)
                setRestStartedAt(session.restStartedAt)
                setRestElapsed(0)
            } else {
                setCurrentIdx(0)
                setDrafts({})
                setTemporaryMachines([])
                setRemovedMachineIds([])
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
            temporaryMachines,
            removedMachineIds,
            startedAt,
            restStartedAt,
        })
    }, [
        currentIdx,
        drafts,
        isSessionReady,
        restStartedAt,
        removedMachineIds,
        startedAt,
        temporaryMachines,
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
        if (sessionMachines.length === 0) return
        if (currentIdx >= sessionMachines.length) {
            setCurrentIdx(sessionMachines.length - 1)
        }
    }, [currentIdx, sessionMachines.length])

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

    const seriesFields: WorkoutSeriesField[] =
        machine && machine.trackingType === 'sets'
            ? [
                  {
                      key: 'set1' as const,
                      label: translate('workout.series.one'),
                      requiresWeight: machine.requiresWeight,
                      weightValue: currentDraft.sets.set1.weight,
                      repsValue: currentDraft.sets.set1.reps,
                      weightPlaceholder:
                          machine.requiresWeight &&
                          machine.recordSets?.[0]?.weight &&
                          machine.recordSets[0].weight > 0
                              ? machine.recordSets[0].weight.toString()
                              : '',
                      repsPlaceholder:
                          machine.recordSets?.[0]?.reps &&
                          machine.recordSets[0].reps > 0
                              ? machine.recordSets[0].reps.toString()
                              : '',
                  },
                  {
                      key: 'set2' as const,
                      label: translate('workout.series.two'),
                      requiresWeight: machine.requiresWeight,
                      weightValue: currentDraft.sets.set2.weight,
                      repsValue: currentDraft.sets.set2.reps,
                      weightPlaceholder:
                          machine.requiresWeight &&
                          machine.recordSets?.[1]?.weight &&
                          machine.recordSets[1].weight > 0
                              ? machine.recordSets[1].weight.toString()
                              : '',
                      repsPlaceholder:
                          machine.recordSets?.[1]?.reps &&
                          machine.recordSets[1].reps > 0
                              ? machine.recordSets[1].reps.toString()
                              : '',
                  },
                  {
                      key: 'set3' as const,
                      label: translate('workout.series.three'),
                      requiresWeight: machine.requiresWeight,
                      weightValue: currentDraft.sets.set3.weight,
                      repsValue: currentDraft.sets.set3.reps,
                      weightPlaceholder:
                          machine.requiresWeight &&
                          machine.recordSets?.[2]?.weight &&
                          machine.recordSets[2].weight > 0
                              ? machine.recordSets[2].weight.toString()
                              : '',
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
                  const isWeightValid =
                      !machine.requiresWeight ||
                      isValidWeightValue(item.weightValue)
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
    const durationConfig: WorkoutDurationConfig | null =
        machine && machine.trackingType === 'duration'
            ? {
                  trackingType: machine.trackingType,
                  elapsedSeconds: getDurationElapsedSeconds(currentDraft),
                  state:
                      currentDraft.duration.startedAt !== null
                          ? 'running'
                          : currentDraft.duration.accumulatedSeconds > 0
                            ? 'completed'
                            : 'idle',
                  lastDurationSeconds:
                      machine.recordSets?.[0]?.durationSeconds &&
                      machine.recordSets[0].durationSeconds > 0
                          ? machine.recordSets[0].durationSeconds
                          : null,
              }
            : null

    return {
        machine,
        isLoading: !isSessionReady || isLoading,
        currentIdx,
        elapsed,
        completedCount,
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
        handleCloseModal: closeModal,
        handleModalConfirm,
        handleQuit,
        handlePreviousMachine: goToPreviousMachine,
        handleNextMachine: goToNextMachine,
        handleNext,
        handleAddTemporaryMachine,
        handleReplaceCurrentMachine,
        canReplaceCurrentMachine:
            !!machine &&
            !!machine.substitutionGroup &&
            !hasDraftValue(machine, drafts[machine.id]),
        sessionCatalogMachineIds: sessionMachines
            .map((item) => item.catalogMachineId)
            .filter((id): id is string => !!id),
        handleRemoveMachine,
        handleSelectMachine: goToMachine,
        handleUpdateDraftField: updateDraftField,
        handleConfirmDraftField: confirmDraftField,
        handleDurationAction,
    }
}
