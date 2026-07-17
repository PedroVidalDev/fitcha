import { useWorkoutMachines } from '@/src/hooks/useWorkoutMachines'
import { useWorkouts } from '@/src/hooks/useWorkouts'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useLayoutEffect, useState } from 'react'
import { useI18n } from '../../contexts/I18nContext'
import { type CatalogMachine } from '../../dtos/CatalogMachine'
import { type DayDeleteTarget, type UseDayScreenParams } from './types'

export function useDayScreen(params: UseDayScreenParams) {
    const { navigation, workoutId } = params
    const { t: translate } = useI18n()
    const {
        addMachineToWorkout,
        removeMachineFromWorkout,
        updateWorkout,
        deleteWorkout,
        refresh: refreshWorkouts,
    } = useWorkouts()
    const { workout, machines, refresh, isLoading } =
        useWorkoutMachines(workoutId)

    const [deleteTarget, setDeleteTarget] = useState<DayDeleteTarget | null>(
        null,
    )
    const [isAddModalVisible, setIsAddModalVisible] = useState(false)
    const [isEditModalVisible, setIsEditModalVisible] = useState(false)
    const [isDeleteWorkoutVisible, setIsDeleteWorkoutVisible] = useState(false)

    useLayoutEffect(() => {
        navigation.setOptions({
            title: workout?.title ?? translate('day.title'),
        })
    }, [navigation, translate, workout?.title])

    useFocusEffect(
        useCallback(() => {
            void refresh()
            void refreshWorkouts()
        }, [refresh, refreshWorkouts]),
    )

    const handleOpenAddModal = useCallback(() => {
        setIsAddModalVisible(true)
    }, [])

    const handleCloseAddModal = useCallback(() => {
        setIsAddModalVisible(false)
    }, [])

    const handleOpenEditModal = useCallback(() => {
        setIsEditModalVisible(true)
    }, [])

    const handleCloseEditModal = useCallback(() => {
        setIsEditModalVisible(false)
    }, [])

    const handleOpenDeleteWorkoutModal = useCallback(() => {
        setIsDeleteWorkoutVisible(true)
    }, [])

    const handleCloseDeleteWorkoutModal = useCallback(() => {
        setIsDeleteWorkoutVisible(false)
    }, [])

    const handleCloseDeleteMachineModal = useCallback(() => {
        setDeleteTarget(null)
    }, [])

    const handlePressMachine = useCallback(
        (machineId: string) => {
            navigation.push('MachineDetail', { machineId })
        },
        [navigation],
    )

    const handleLongPressMachine = useCallback((machine: DayDeleteTarget) => {
        setDeleteTarget(machine)
    }, [])

    const handleStartWorkout = useCallback(() => {
        navigation.navigate('Workout', { workoutId })
    }, [navigation, workoutId])

    const handleEditWorkout = useCallback(
        async (name: string, description?: string) => {
            await updateWorkout(workoutId, name, description)
            await refresh()
        },
        [refresh, updateWorkout, workoutId],
    )

    const handleAddMachine = useCallback(
        async (machine: CatalogMachine) => {
            await addMachineToWorkout(workoutId, machine.id)
            await refresh()
        },
        [addMachineToWorkout, refresh, workoutId],
    )

    const handleConfirmDeleteMachine = useCallback(async () => {
        if (deleteTarget) {
            await removeMachineFromWorkout(workoutId, deleteTarget.id)
            await refresh()
        }

        setDeleteTarget(null)
    }, [deleteTarget, refresh, removeMachineFromWorkout, workoutId])

    const handleConfirmDeleteWorkout = useCallback(async () => {
        await deleteWorkout(workoutId)
        setIsDeleteWorkoutVisible(false)
        navigation.goBack()
    }, [deleteWorkout, navigation, workoutId])

    return {
        workout,
        machines,
        isLoading,
        deleteTarget,
        isAddModalVisible,
        isEditModalVisible,
        isDeleteWorkoutVisible,
        handleOpenAddModal,
        handleCloseAddModal,
        handleOpenEditModal,
        handleCloseEditModal,
        handleOpenDeleteWorkoutModal,
        handleCloseDeleteWorkoutModal,
        handleCloseDeleteMachineModal,
        handlePressMachine,
        handleLongPressMachine,
        handleStartWorkout,
        handleEditWorkout,
        handleAddMachine,
        handleConfirmDeleteMachine,
        handleConfirmDeleteWorkout,
    }
}
