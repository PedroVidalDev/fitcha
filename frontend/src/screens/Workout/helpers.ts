import {
    WorkoutDraft,
    WorkoutDraftMap,
    WorkoutMachine,
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
    duration: {
        startedAt: null,
        accumulatedSeconds: 0,
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

export function buildYouTubeTutorialUrl(machineName: string): string {
    const query = `${machineName.trim()} how to do exercise`.trim()

    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}

export function getWorkoutDraft(draft?: WorkoutDraft): WorkoutDraft {
    return {
        sets: {
            ...EMPTY_WORKOUT_DRAFT.sets,
            ...(draft?.sets ?? {}),
        },
        confirmed: {
            ...EMPTY_WORKOUT_DRAFT.confirmed,
            ...(draft?.confirmed ?? {}),
        },
        duration: {
            ...EMPTY_WORKOUT_DRAFT.duration,
            ...(draft?.duration ?? {}),
        },
    }
}

export function getDurationElapsedSeconds(draft?: WorkoutDraft): number {
    const normalizedDraft = getWorkoutDraft(draft)
    const runningElapsed = normalizedDraft.duration.startedAt
        ? Math.max(
              0,
              Math.floor(
                  (Date.now() - normalizedDraft.duration.startedAt) / 1000,
              ),
          )
        : 0

    return normalizedDraft.duration.accumulatedSeconds + runningElapsed
}

export function hasDraftValue(
    machine: WorkoutMachine,
    draft?: WorkoutDraft,
): boolean {
    const normalizedDraft = getWorkoutDraft(draft)

    if (machine.trackingType === 'duration') {
        return (
            normalizedDraft.duration.startedAt !== null ||
            normalizedDraft.duration.accumulatedSeconds > 0
        )
    }

    return WORKOUT_SET_KEYS.some((key) => {
        const set = normalizedDraft.sets[key]
        return set.weight.trim().length > 0 || set.reps.trim().length > 0
    })
}

export function isDraftComplete(
    machine: WorkoutMachine,
    draft?: WorkoutDraft,
): boolean {
    const normalizedDraft = getWorkoutDraft(draft)

    if (machine.trackingType === 'duration') {
        return (
            normalizedDraft.duration.startedAt === null &&
            normalizedDraft.duration.accumulatedSeconds > 0
        )
    }

    return WORKOUT_SET_KEYS.every((key) => {
        const set = normalizedDraft.sets[key]
        const weight = parseWeight(set.weight)
        const reps = parseReps(set.reps)

        return (
            normalizedDraft.confirmed[key] &&
            (!machine.requiresWeight ||
                (!Number.isNaN(weight) && weight > 0)) &&
            !Number.isNaN(reps) &&
            reps > 0
        )
    })
}

export function draftToResult(
    machine: WorkoutMachine,
    draft?: WorkoutDraft,
): WorkoutResult | null {
    if (!isDraftComplete(machine, draft)) return null

    const normalizedDraft = getWorkoutDraft(draft)
    if (machine.trackingType === 'duration') {
        return {
            ...(machine.isTemporary && machine.catalogMachineId
                ? { catalogMachineId: machine.catalogMachineId }
                : { machineId: machine.id }),
            sets: [
                {
                    weight: 0,
                    reps: 0,
                    durationSeconds:
                        normalizedDraft.duration.accumulatedSeconds,
                },
            ],
        }
    }

    const { sets } = normalizedDraft
    return {
        ...(machine.isTemporary && machine.catalogMachineId
            ? { catalogMachineId: machine.catalogMachineId }
            : { machineId: machine.id }),
        sets: WORKOUT_SET_KEYS.map((key) => ({
            weight: machine.requiresWeight ? parseWeight(sets[key].weight) : 0,
            reps: parseReps(sets[key].reps),
            durationSeconds: 0,
        })),
    }
}

export function buildWorkoutResults(
    machines: WorkoutMachine[],
    drafts: WorkoutDraftMap,
): WorkoutResult[] {
    return machines
        .map((machine) => draftToResult(machine, drafts[machine.id]))
        .filter((result): result is WorkoutResult => result !== null)
}
