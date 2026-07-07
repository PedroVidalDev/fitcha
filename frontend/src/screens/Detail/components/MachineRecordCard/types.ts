import { HistoryEntry } from '@/src/dtos/HistoryEntry'
import { Machine } from '@/src/dtos/Machine'

export type MachineRecordCardProps = {
    machine: Machine
    history: HistoryEntry[]
    width: number
}
