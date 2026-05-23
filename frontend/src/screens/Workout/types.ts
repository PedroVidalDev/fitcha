import { RootStackParamList } from "@/src/router/types";
import { RouteProp } from "@react-navigation/native";

export type WorkoutResult = { machineId: string; sets: [number, number, number] };
export type WorkoutSetKey = "set1" | "set2" | "set3";
export type WorkoutDraft = {
    set1: string;
    set2: string;
    set3: string;
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
