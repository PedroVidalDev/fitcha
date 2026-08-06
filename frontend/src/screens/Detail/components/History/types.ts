import { HistoryEntry } from '@/src/dtos/HistoryEntry'
import { Machine } from '@/src/dtos/Machine'

export type HistoryProps = {
    item: HistoryEntry
    index: number
    machine: Machine
    isBusy?: boolean
    onRequestDelete: (entry: HistoryEntry) => void
}
