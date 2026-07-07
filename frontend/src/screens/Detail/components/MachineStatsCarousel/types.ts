import { HistoryEntry } from '@/src/dtos/HistoryEntry'
import { Machine } from '@/src/dtos/Machine'

export type MachineStatsCarouselProps = {
    machine: Machine
    history: HistoryEntry[]
}
