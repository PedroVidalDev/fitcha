import { HistoryEntry } from "./HistoryEntry";
import { Machine } from "./Machine";
import { WorkoutPlan } from "./WorkoutPlan";

export type AppData = {
    machines: Record<string, Machine>;
    workouts: Record<string, WorkoutPlan>;
    workoutOrder: number[];
    history: Record<string, HistoryEntry[]>;
};
