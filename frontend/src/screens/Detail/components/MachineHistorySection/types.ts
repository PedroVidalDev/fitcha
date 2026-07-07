import { HistoryEntry } from '@/src/dtos/HistoryEntry'
import { Machine } from '@/src/dtos/Machine'

export type MachineHistorySectionProps = {
    machine: Machine
    history: HistoryEntry[]
}
