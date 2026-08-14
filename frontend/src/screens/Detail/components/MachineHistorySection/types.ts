import { HistoryEntry } from '@/src/dtos/HistoryEntry'
import { Machine } from '@/src/dtos/Machine'

export type MachineHistorySectionProps = {
    machine: Machine
    history: HistoryEntry[]
    page: number
    totalPages: number
    isLoading: boolean
    errorMessage?: string
    onChangePage: (page: number) => void
    deletingHistoryId?: string
    onRequestDelete: (entry: HistoryEntry) => void
}
