export type HistorySet = {
    weight: number
    reps: number
    durationSeconds: number
}

export type HistoryEntry = {
    id: string
    sets: HistorySet[]
    date: string
    label: string
}
