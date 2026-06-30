import { HistoryEntry, HistorySet } from '../dtos/HistoryEntry'
import { Machine } from '../dtos/Machine'

type MachineTrackingConfig = Pick<Machine, 'trackingType' | 'requiresWeight'>
export type HistoryMetricKind = 'weight' | 'reps' | 'duration'

function getHistoryMetricKindFromSets(sets: HistorySet[]): HistoryMetricKind {
    if (sets.some((set) => set.durationSeconds > 0)) {
        return 'duration'
    }

    if (sets.some((set) => set.weight > 0)) {
        return 'weight'
    }

    return 'reps'
}

export function getHistoryMetricKind(
    machine?: MachineTrackingConfig | null,
    sets: HistorySet[] = [],
): HistoryMetricKind {
    if (machine?.trackingType === 'duration') {
        return 'duration'
    }

    if (machine && !machine.requiresWeight) {
        return 'reps'
    }

    return getHistoryMetricKindFromSets(sets)
}

export function getHistoryEntryVolume(entry: Pick<HistoryEntry, 'sets'>) {
    return entry.sets.reduce((sum, set) => {
        if (set.reps > 0) {
            return sum + set.weight * set.reps
        }

        return sum + set.weight
    }, 0)
}

export function getHistoryEntryTotalReps(entry: Pick<HistoryEntry, 'sets'>) {
    return entry.sets.reduce((sum, set) => sum + set.reps, 0)
}

export function getHistoryEntryDuration(entry: Pick<HistoryEntry, 'sets'>) {
    return entry.sets.reduce((sum, set) => sum + set.durationSeconds, 0)
}

export function getHistoryEntryMaxWeight(entry: Pick<HistoryEntry, 'sets'>) {
    return entry.sets.reduce(
        (maxWeight, set) => Math.max(maxWeight, set.weight),
        0,
    )
}

export function getHistoryEntryPrimaryMetric(
    entry: Pick<HistoryEntry, 'sets'>,
    machine?: MachineTrackingConfig | null,
) {
    const metricKind = getHistoryMetricKind(machine, entry.sets)

    switch (metricKind) {
        case 'duration':
            return getHistoryEntryDuration(entry)
        case 'reps':
            return getHistoryEntryTotalReps(entry)
        default:
            return getHistoryEntryVolume(entry)
    }
}

export function getRecordHistoryEntry<
    T extends Pick<HistoryEntry, 'date' | 'sets'>,
>(entries: T[], machine?: MachineTrackingConfig | null) {
    return entries.reduce<T | null>((bestEntry, entry) => {
        if (!bestEntry) return entry

        const metricKind = getHistoryMetricKind(machine, entry.sets)
        const bestMetric = getHistoryEntryPrimaryMetric(bestEntry, machine)
        const currentMetric = getHistoryEntryPrimaryMetric(entry, machine)

        if (currentMetric !== bestMetric) {
            return currentMetric > bestMetric ? entry : bestEntry
        }

        if (metricKind === 'weight') {
            const bestMaxWeight = getHistoryEntryMaxWeight(bestEntry)
            const currentMaxWeight = getHistoryEntryMaxWeight(entry)

            if (currentMaxWeight !== bestMaxWeight) {
                return currentMaxWeight > bestMaxWeight ? entry : bestEntry
            }
        }

        return new Date(entry.date).getTime() >
            new Date(bestEntry.date).getTime()
            ? entry
            : bestEntry
    }, null)
}

export function formatDurationSeconds(seconds: number) {
    const normalized = Math.max(0, Math.trunc(seconds))
    const hours = Math.floor(normalized / 3600)
    const minutes = Math.floor((normalized % 3600) / 60)
    const remainingSeconds = normalized % 60

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
    }

    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

export function formatHistoryMetricValue(
    value: number | null,
    metricKind: HistoryMetricKind,
) {
    if (value === null) {
        return '--'
    }

    switch (metricKind) {
        case 'duration':
            return formatDurationSeconds(value)
        case 'weight':
            return `${value}kg`
        default:
            return `${value}`
    }
}

export function formatSetSequence(
    sets: HistorySet[],
    separator = ' / ',
    machine?: MachineTrackingConfig | null,
) {
    if (sets.length === 0) {
        return '--'
    }

    const metricKind = getHistoryMetricKind(machine, sets)

    return sets
        .map((set) => {
            if (metricKind === 'duration' || set.durationSeconds > 0) {
                return formatDurationSeconds(set.durationSeconds)
            }

            if (set.weight > 0 && set.reps > 0) {
                return `${set.weight}kg x${set.reps}`
            }

            if (set.weight > 0) {
                return `${set.weight}kg`
            }

            return `x${set.reps}`
        })
        .join(separator)
}
