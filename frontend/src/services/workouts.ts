import { isAxiosError } from 'axios'
import { Machine } from '../dtos/Machine'
import { WorkoutPlan } from '../dtos/WorkoutPlan'
import { translateRuntime } from '../translates/runtime'
import { axiosApp, ensureApiUrlConfigured } from './axios'

export type WorkoutMachineInput = {
    catalogMachineId?: string
    name?: string
    description?: string
    photo?: string
    categoryKey?: Machine['categoryKey']
    trackingType?: Machine['trackingType']
    requiresWeight?: Machine['requiresWeight']
}

export type CreateWorkoutInput = {
    title: string
    description?: string
}

export type UpdateWorkoutInput = Partial<CreateWorkoutInput>

export type AddWorkoutMachineResponse = {
    workout: WorkoutPlan
    machine: Machine
}

export type RemoveWorkoutMachineResponse = {
    workout: WorkoutPlan
    removedMachine: boolean
}

function getWorkoutErrorMessage(error: unknown, fallback: string) {
    if (isAxiosError(error)) {
        const responseData = error.response?.data

        if (
            responseData &&
            typeof responseData === 'object' &&
            'error' in responseData &&
            typeof responseData.error === 'string' &&
            responseData.error.trim()
        ) {
            return responseData.error
        }
    }

    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return fallback
}

export async function getMyWorkouts() {
    ensureApiUrlConfigured()

    try {
        const response = await axiosApp.get<WorkoutPlan[]>('/me/workouts')
        return response.data
    } catch (error) {
        throw new Error(
            getWorkoutErrorMessage(
                error,
                translateRuntime('services.workouts.loadError'),
            ),
        )
    }
}

export async function createWorkout(input: CreateWorkoutInput) {
    ensureApiUrlConfigured()

    try {
        const response = await axiosApp.post<WorkoutPlan>('/me/workouts', input)
        return response.data
    } catch (error) {
        throw new Error(
            getWorkoutErrorMessage(
                error,
                translateRuntime('services.workouts.createError'),
            ),
        )
    }
}

export async function updateWorkout(
    workoutId: number,
    input: UpdateWorkoutInput,
) {
    ensureApiUrlConfigured()

    try {
        const response = await axiosApp.patch<WorkoutPlan>(
            `/me/workouts/${workoutId}`,
            input,
        )
        return response.data
    } catch (error) {
        throw new Error(
            getWorkoutErrorMessage(
                error,
                translateRuntime('services.workouts.updateError'),
            ),
        )
    }
}

export async function deleteWorkout(workoutId: number) {
    ensureApiUrlConfigured()

    try {
        await axiosApp.delete(`/me/workouts/${workoutId}`)
    } catch (error) {
        throw new Error(
            getWorkoutErrorMessage(
                error,
                translateRuntime('services.workouts.deleteError'),
            ),
        )
    }
}

export async function addMachineToWorkout(
    workoutId: number,
    input: WorkoutMachineInput,
) {
    ensureApiUrlConfigured()

    try {
        const response = await axiosApp.post<AddWorkoutMachineResponse>(
            `/me/workouts/${workoutId}/machines`,
            input,
        )
        return response.data
    } catch (error) {
        throw new Error(
            getWorkoutErrorMessage(
                error,
                translateRuntime('services.workouts.addMachineError'),
            ),
        )
    }
}

export async function removeMachineFromWorkout(
    workoutId: number,
    machineId: string,
) {
    ensureApiUrlConfigured()

    try {
        const response = await axiosApp.delete<RemoveWorkoutMachineResponse>(
            `/me/workouts/${workoutId}/machines/${machineId}`,
        )
        return response.data
    } catch (error) {
        throw new Error(
            getWorkoutErrorMessage(
                error,
                translateRuntime('services.workouts.removeMachineError'),
            ),
        )
    }
}
