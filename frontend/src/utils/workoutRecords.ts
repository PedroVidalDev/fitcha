import { HistoryEntry } from "../dtos/HistoryEntry";

export function getHistoryEntryVolume(entry: Pick<HistoryEntry, "sets">) {
    return entry.sets.reduce((sum, weight) => sum + weight, 0);
}

export function getHistoryEntryMaxWeight(entry: Pick<HistoryEntry, "sets">) {
    return Math.max(...entry.sets);
}

export function getRecordHistoryEntry<T extends Pick<HistoryEntry, "date" | "sets">>(entries: T[]) {
    return entries.reduce<T | null>((bestEntry, entry) => {
        if (!bestEntry) return entry;

        const bestVolume = getHistoryEntryVolume(bestEntry);
        const currentVolume = getHistoryEntryVolume(entry);

        if (currentVolume !== bestVolume) {
            return currentVolume > bestVolume ? entry : bestEntry;
        }

        const bestMaxWeight = getHistoryEntryMaxWeight(bestEntry);
        const currentMaxWeight = getHistoryEntryMaxWeight(entry);

        if (currentMaxWeight !== bestMaxWeight) {
            return currentMaxWeight > bestMaxWeight ? entry : bestEntry;
        }

        return new Date(entry.date).getTime() > new Date(bestEntry.date).getTime()
            ? entry
            : bestEntry;
    }, null);
}

export function formatSetSequence(sets: [number, number, number], separator = "/") {
    return sets.join(separator);
}
