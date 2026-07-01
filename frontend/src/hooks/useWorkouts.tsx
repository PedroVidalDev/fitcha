import { useCallback, useEffect, useState } from 'react'
import { Machine } from '../dtos/Machine'
import { WorkoutPlan } from '../dtos/WorkoutPlan'
import {
    addMachineToWorkout as addMachineToWorkoutRequest,
    createWorkoutPlan,
    deleteWorkoutPlan,
    getCachedWorkoutData,
    loadWorkoutData,
    removeMachineFromWorkout as removeMachineFromWorkoutRequest,
    updateWorkoutPlan,
} from '../services/workoutData'

export type WorkoutWithMachines = WorkoutPlan & {
    machines: Machine[]
}

export function useWorkouts() {
    const [workouts, setWorkouts] = useState<WorkoutWithMachines[]>([])

    const setWorkoutsFromData = useCallback(
        (data: {
            workoutOrder: number[]
            workouts: Record<string, WorkoutPlan>
            machines: Record<string, Machine>
        }) => {
            const nextWorkouts = data.workoutOrder
                .map((workoutId) => data.workouts[String(workoutId)])
                .filter(Boolean)
                .map((workout) => ({
                    ...workout,
                    machines: workout.machineIds
                        .map((machineId) => data.machines[machineId])
                        .filter(Boolean),
                }))

            setWorkouts(nextWorkouts)
        },
        [],
    )

    const refresh = useCallback(
        async (options?: { forceSync?: boolean }) => {
            const cachedData = await getCachedWorkoutData()
            setWorkoutsFromData(cachedData)

            const data = await loadWorkoutData(options)
            setWorkoutsFromData(data)
        },
        [setWorkoutsFromData],
    )

    const create = useCallback(
        async (title: string, description?: string) => {
            await createWorkoutPlan(title, description)
            const data = await getCachedWorkoutData()
            setWorkoutsFromData(data)
        },
        [setWorkoutsFromData],
    )

    const update = useCallback(
        async (workoutId: number, title?: string, description?: string) => {
            await updateWorkoutPlan(workoutId, title, description)
            const data = await getCachedWorkoutData()
            setWorkoutsFromData(data)
        },
        [setWorkoutsFromData],
    )

    const remove = useCallback(
        async (workoutId: number) => {
            const data = await deleteWorkoutPlan(workoutId)
            setWorkoutsFromData(data)
        },
        [setWorkoutsFromData],
    )

    const addMachineToWorkout = useCallback(
        async (workoutId: number, catalogMachineId: string) => {
            await addMachineToWorkoutRequest(workoutId, {
                catalogMachineId,
            })
            const data = await getCachedWorkoutData()
            setWorkoutsFromData(data)
        },
        [setWorkoutsFromData],
    )

    const removeMachineFromWorkout = useCallback(
        async (workoutId: number, machineId: string) => {
            await removeMachineFromWorkoutRequest(workoutId, machineId)
            const data = await getCachedWorkoutData()
            setWorkoutsFromData(data)
        },
        [setWorkoutsFromData],
    )

    useEffect(() => {
        refresh()
    }, [refresh])

    return {
        workouts,
        createWorkout: create,
        updateWorkout: update,
        deleteWorkout: remove,
        addMachineToWorkout,
        removeMachineFromWorkout,
        refresh,
    }
}
