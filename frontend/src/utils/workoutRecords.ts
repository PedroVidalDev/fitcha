import { HistoryEntry, HistorySet } from '../dtos/HistoryEntry'

export function getHistoryEntryVolume(entry: Pick<HistoryEntry, 'sets'>) {
    return entry.sets.reduce((sum, set) => {
        if (set.reps > 0) {
            return sum + set.weight * set.reps
        }

        return sum + set.weight
    }, 0)
}

export function getHistoryEntryMaxWeight(entry: Pick<HistoryEntry, 'sets'>) {
    return entry.sets.reduce(
        (maxWeight, set) => Math.max(maxWeight, set.weight),
        0,
    )
}

export function getRecordHistoryEntry<
    T extends Pick<HistoryEntry, 'date' | 'sets'>,
>(entries: T[]) {
    return entries.reduce<T | null>((bestEntry, entry) => {
        if (!bestEntry) return entry

        const bestVolume = getHistoryEntryVolume(bestEntry)
        const currentVolume = getHistoryEntryVolume(entry)

        if (currentVolume !== bestVolume) {
            return currentVolume > bestVolume ? entry : bestEntry
        }

        const bestMaxWeight = getHistoryEntryMaxWeight(bestEntry)
        const currentMaxWeight = getHistoryEntryMaxWeight(entry)

        if (currentMaxWeight !== bestMaxWeight) {
            return currentMaxWeight > bestMaxWeight ? entry : bestEntry
        }

        return new Date(entry.date).getTime() >
            new Date(bestEntry.date).getTime()
            ? entry
            : bestEntry
    }, null)
}

export function formatSetSequence(sets: HistorySet[], separator = ' / ') {
    if (sets.length === 0) {
        return '--'
    }

    return sets
        .map((set) =>
            set.reps > 0 ? `${set.weight}kg x${set.reps}` : `${set.weight}kg`,
        )
        .join(separator)
}
