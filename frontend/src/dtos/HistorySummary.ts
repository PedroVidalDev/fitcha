import { HistoryEntry } from './HistoryEntry'

export type MachineHistorySummary = {
    latest: HistoryEntry | null
    previous: HistoryEntry | null
    first: HistoryEntry | null
    record: HistoryEntry | null
    sessionCount: number
    recent: HistoryEntry[]
}

export type HistorySummary = {
    workoutDates: string[]
    byMachine: Record<string, MachineHistorySummary>
}
