import {
    deleteHistoryEntry,
    getMachineHistory,
    transferMachineHistory,
    TransferMachineHistoryInput,
} from './history'
import {
    cacheMachineHistoryPage,
    clearCachedMachineHistory,
    getCachedMachineHistoryPage,
} from './machineHistoryCache'
import { cacheMachineData } from './machineData'
import { clearScheduledNotifications } from './notifications'
import { markWorkoutDataStale } from './workoutData'

export async function getCachedMachineHistoryData(
    machineId: string,
    page: number,
    limit: number,
) {
    return getCachedMachineHistoryPage(machineId, page, limit)
}

export async function loadMachineHistoryData(
    machineId: string,
    page: number,
    limit: number,
) {
    const response = await getMachineHistory(machineId, { page, limit })
    await cacheMachineHistoryPage(machineId, response)
    return response
}

export async function deleteMachineHistoryData(
    machineId: string,
    historyId: string,
) {
    await deleteHistoryEntry(historyId)
    markWorkoutDataStale()
    await clearCachedMachineHistory(machineId)
}

export async function transferMachineHistoryData(
    sourceMachineId: string,
    input: TransferMachineHistoryInput,
) {
    const response = await transferMachineHistory(sourceMachineId, input)
    markWorkoutDataStale()
    await Promise.all([
        clearCachedMachineHistory(sourceMachineId),
        clearCachedMachineHistory(response.targetMachine.id),
        cacheMachineData(response.targetMachine),
    ])
    if (response.updatedWorkouts.length > 0) {
        try {
            await clearScheduledNotifications()
        } catch {
            // Notification cleanup cannot block a completed history transfer.
        }
    }
    return response
}
