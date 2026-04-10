import { formatDateLabel } from "@/src/utils/formatDateLabel";
import { useCallback, useEffect, useState } from "react";
import { HistoryEntry } from "../../../dtos/HistoryEntry";
import { Machine } from "../../../dtos/Machine";
import { getCachedWorkoutData, loadWorkoutData } from "../../../services/workoutData";

export function useMachineHistory(machineId: string) {
    const [machine, setMachine] = useState<Machine | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    const setStateFromData = useCallback(
        (data: { machines: Record<string, Machine>; history: Record<string, HistoryEntry[]> }) => {
            setMachine(data.machines[machineId] ?? null);
            const entries = (data.history[machineId] ?? []).map((entry) => ({
                ...entry,
                label: formatDateLabel(entry.date),
            }));
            setHistory(entries);
        },
        [machineId],
    );

    useEffect(() => {
        const load = async () => {
            const cachedData = await getCachedWorkoutData();
            setStateFromData(cachedData);

            const data = await loadWorkoutData();
            setStateFromData(data);
        };

        void load();
    }, [setStateFromData]);

    return { machine, history };
}
