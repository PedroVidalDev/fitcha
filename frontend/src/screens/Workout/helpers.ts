import {
    WorkoutDraft,
    WorkoutDraftMap,
    WorkoutResult,
    WORKOUT_SET_KEYS,
} from './types'

export const EMPTY_WORKOUT_DRAFT: WorkoutDraft = {
    sets: {
        set1: { weight: '', reps: '' },
        set2: { weight: '', reps: '' },
        set3: { weight: '', reps: '' },
    },
    confirmed: {
        set1: false,
        set2: false,
        set3: false,
    },
}

export function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0)
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function parseWeight(value: string): number {
    return Number(value.trim().replace(',', '.'))
}

export function parseReps(value: string): number {
    const parsed = Number(value.trim().replace(',', '.'))
    return Number.isInteger(parsed) ? parsed : Number.NaN
}

export function getWorkoutDraft(draft?: WorkoutDraft): WorkoutDraft {
    return draft ?? EMPTY_WORKOUT_DRAFT
}

export function hasDraftValue(draft?: WorkoutDraft): boolean {
    const normalizedDraft = getWorkoutDraft(draft)
    return WORKOUT_SET_KEYS.some((key) => {
        const set = normalizedDraft.sets[key]
        return set.weight.trim().length > 0 || set.reps.trim().length > 0
    })
}

export function isDraftComplete(draft?: WorkoutDraft): boolean {
    const normalizedDraft = getWorkoutDraft(draft)

    return WORKOUT_SET_KEYS.every((key) => {
        const set = normalizedDraft.sets[key]
        const weight = parseWeight(set.weight)
        const reps = parseReps(set.reps)

        return (
            normalizedDraft.confirmed[key] &&
            !Number.isNaN(weight) &&
            weight > 0 &&
            !Number.isNaN(reps) &&
            reps > 0
        )
    })
}

export function draftToResult(
    machineId: string,
    draft?: WorkoutDraft,
): WorkoutResult | null {
    if (!isDraftComplete(draft)) return null

    const { sets } = getWorkoutDraft(draft)
    return {
        machineId,
        sets: WORKOUT_SET_KEYS.map((key) => ({
            weight: parseWeight(sets[key].weight),
            reps: parseReps(sets[key].reps),
        })),
    }
}

export function buildWorkoutResults(
    machineIds: string[],
    drafts: WorkoutDraftMap,
): WorkoutResult[] {
    return machineIds
        .map((machineId) => draftToResult(machineId, drafts[machineId]))
        .filter((result): result is WorkoutResult => result !== null)
}
