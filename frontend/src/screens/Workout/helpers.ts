import { WorkoutDraft, WorkoutDraftMap, WorkoutResult, WORKOUT_SET_KEYS } from "./types";

export const EMPTY_WORKOUT_DRAFT: WorkoutDraft = {
    set1: "",
    set2: "",
    set3: "",
    confirmed: {
        set1: false,
        set2: false,
        set3: false,
    },
};

export function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function parseWeight(value: string): number {
    return parseFloat(value.replace(",", "."));
}

export function getWorkoutDraft(draft?: WorkoutDraft): WorkoutDraft {
    return draft ?? EMPTY_WORKOUT_DRAFT;
}

export function hasDraftValue(draft?: WorkoutDraft): boolean {
    const normalizedDraft = getWorkoutDraft(draft);
    return WORKOUT_SET_KEYS.some((key) => normalizedDraft[key].trim().length > 0);
}

export function isDraftComplete(draft?: WorkoutDraft): boolean {
    const normalizedDraft = getWorkoutDraft(draft);

    return WORKOUT_SET_KEYS.every((key) => {
        const value = parseWeight(normalizedDraft[key]);
        return normalizedDraft.confirmed[key] && !Number.isNaN(value) && value > 0;
    });
}

export function draftToResult(machineId: string, draft?: WorkoutDraft): WorkoutResult | null {
    if (!isDraftComplete(draft)) return null;

    const { set1, set2, set3 } = getWorkoutDraft(draft);
    return {
        machineId,
        sets: [parseWeight(set1), parseWeight(set2), parseWeight(set3)],
    };
}

export function buildWorkoutResults(
    machineIds: string[],
    drafts: WorkoutDraftMap,
): WorkoutResult[] {
    return machineIds
        .map((machineId) => draftToResult(machineId, drafts[machineId]))
        .filter((result): result is WorkoutResult => result !== null);
}
