import { useCallback } from "react";
import { saveWorkoutResults } from "../../../services/workoutData";

export function useSaveWorkout() {
    return useCallback(async (results: { machineId: string; sets: [number, number, number] }[]) => {
        await saveWorkoutResults(results);
    }, []);
}
