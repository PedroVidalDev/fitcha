import {
    deleteHistoryEntry,
    getMachineHistory,
    transferMachineHistory,
    TransferMachineHistoryInput,
} from './history'
import { cacheMachineData } from './machineData'
import { clearScheduledNotifications } from './notifications'
import { markWorkoutDataStale } from './workoutData'

export async function loadMachineHistoryData(
    machineId: string,
    page: number,
    limit: number,
) {
    return getMachineHistory(machineId, { page, limit })
}

export async function deleteMachineHistoryData(historyId: string) {
    await deleteHistoryEntry(historyId)
    markWorkoutDataStale()
}

export async function transferMachineHistoryData(
    sourceMachineId: string,
    input: TransferMachineHistoryInput,
) {
    const response = await transferMachineHistory(sourceMachineId, input)
    markWorkoutDataStale()
    await cacheMachineData(response.targetMachine)

    if (response.updatedWorkouts.length > 0) {
        try {
            await clearScheduledNotifications()
        } catch {
            // Notification cleanup cannot block a completed history transfer.
        }
    }

    return response
}
