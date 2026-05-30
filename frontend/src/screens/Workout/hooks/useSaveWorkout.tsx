import { useCallback } from "react";
import { WorkoutHistoryInput } from "../../../services/history";
import { saveWorkoutResults } from "../../../services/workoutData";

export function useSaveWorkout() {
    return useCallback(async (results: WorkoutHistoryInput[]) => {
        await saveWorkoutResults(results);
    }, []);
}
