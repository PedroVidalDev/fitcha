import { WorkoutDraft, WorkoutDraftMap, WorkoutResult } from "./types";

export const EMPTY_WORKOUT_DRAFT: WorkoutDraft = { set1: "", set2: "", set3: "" };

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
    const { set1, set2, set3 } = getWorkoutDraft(draft);
    return [set1, set2, set3].some((value) => value.trim().length > 0);
}

export function isDraftComplete(draft?: WorkoutDraft): boolean {
    const { set1, set2, set3 } = getWorkoutDraft(draft);

    return [set1, set2, set3]
        .map(parseWeight)
        .every((value) => !Number.isNaN(value) && value > 0);
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
