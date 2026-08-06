import { isAxiosError } from 'axios'
import { HistorySet } from '../dtos/HistoryEntry'
import { Machine } from '../dtos/Machine'
import { WorkoutPlan } from '../dtos/WorkoutPlan'
import { translateRuntime } from '../translates/runtime'
import { axiosApp, ensureApiUrlConfigured } from './axios'

export type HistoryApiEntry = {
    id: string
    machineId: string
    sets: HistorySet[]
    date: string
}

export type WorkoutHistoryInput =
    | {
          machineId: string
          sets: HistorySet[]
      }
    | {
          catalogMachineId: string
          sets: HistorySet[]
      }

export type TransferMachineHistoryInput =
    | {
          targetUserMachineId: string
          replaceInWorkouts: boolean
      }
    | {
          targetCatalogMachineId: string
          replaceInWorkouts: boolean
      }

export type TransferMachineHistoryResponse = {
    sourceMachineId: string
    targetMachine: Machine
    transferredCount: number
    updatedWorkouts: WorkoutPlan[]
}

function getHistoryErrorMessage(error: unknown, fallback: string) {
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

export async function getMyHistory() {
    ensureApiUrlConfigured()

    try {
        const response = await axiosApp.get<HistoryApiEntry[]>('/me/history')
        return response.data
    } catch (error) {
        throw new Error(
            getHistoryErrorMessage(
                error,
                translateRuntime('services.history.loadError'),
            ),
        )
    }
}

export async function createWorkoutHistory(results: WorkoutHistoryInput[]) {
    ensureApiUrlConfigured()

    try {
        const response = await axiosApp.post<HistoryApiEntry[]>(
            '/me/history/workouts',
            {
                results,
            },
        )
        return response.data
    } catch (error) {
        throw new Error(
            getHistoryErrorMessage(
                error,
                translateRuntime('services.history.saveError'),
            ),
        )
    }
}

export async function deleteHistoryEntry(historyId: string) {
    ensureApiUrlConfigured()

    try {
        await axiosApp.delete(`/me/history/${historyId}`)
    } catch (error) {
        throw new Error(
            getHistoryErrorMessage(
                error,
                translateRuntime('services.history.deleteError'),
            ),
        )
    }
}

export async function transferMachineHistory(
    sourceMachineId: string,
    input: TransferMachineHistoryInput,
) {
    ensureApiUrlConfigured()

    try {
        const response = await axiosApp.patch<TransferMachineHistoryResponse>(
            `/me/history/machines/${sourceMachineId}/transfer`,
            input,
        )
        return response.data
    } catch (error) {
        throw new Error(
            getHistoryErrorMessage(
                error,
                translateRuntime('services.history.transferError'),
            ),
        )
    }
}
