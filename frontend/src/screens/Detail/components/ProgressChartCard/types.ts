import { HistoryEntry } from '@/src/dtos/HistoryEntry'
import { Machine } from '@/src/dtos/Machine'

export type ProgressChartCardProps = {
    history: HistoryEntry[]
    machine: Machine
    width: number
}

export type ProgressDatum = {
    id: string
    index: number
    label: string
    value: number
    sequence: string
    metricText: string
}
