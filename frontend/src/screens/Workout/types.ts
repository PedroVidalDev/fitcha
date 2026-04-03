import { RootStackParamList } from "@/src/router/types";
import { RouteProp } from "@react-navigation/native";

export type WorkoutResult = { machineId: string; sets: [number, number, number] };
export type WorkoutDraft = { set1: string; set2: string; set3: string };
export type WorkoutDraftMap = Record<string, WorkoutDraft>;
export type Route = RouteProp<RootStackParamList, "Workout">;

export type WorkoutModalConfig = {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    hideCancel?: boolean;
    confirmVariant?: "danger" | "accent";
    onConfirm: () => void;
};