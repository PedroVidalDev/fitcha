import { RootStackParamList } from "@/src/router/types";
import { RouteProp } from "@react-navigation/native";
import { HistorySet } from "../../dtos/HistoryEntry";

export type WorkoutResult = { machineId: string; sets: HistorySet[] };
export type WorkoutSetKey = "set1" | "set2" | "set3";
export type WorkoutDraftFieldKey = "weight" | "reps";
export type WorkoutSetDraft = {
    weight: string;
    reps: string;
};
export type WorkoutDraft = {
    sets: Record<WorkoutSetKey, WorkoutSetDraft>;
    confirmed: Record<WorkoutSetKey, boolean>;
};
export type WorkoutDraftMap = Record<string, WorkoutDraft>;
export type Route = RouteProp<RootStackParamList, "Workout">;
export const WORKOUT_SET_KEYS: WorkoutSetKey[] = ["set1", "set2", "set3"];

export type WorkoutModalConfig = {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    hideCancel?: boolean;
    confirmVariant?: "danger" | "accent";
    onConfirm: () => void;
};
