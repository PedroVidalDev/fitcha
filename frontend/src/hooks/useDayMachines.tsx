import { useCallback, useEffect, useState } from "react";
import { HistoryEntry, HistorySet } from "../dtos/HistoryEntry";
import { Machine } from "../dtos/Machine";
import { getCachedWorkoutData, loadWorkoutData } from "../services/workoutData";
import { getRecordHistoryEntry } from "../utils/workoutRecords";

type MachineWithHistory = Machine & {
    lastWeight: number | null;
    lastSets: HistorySet[] | null;
    recordSets: HistorySet[] | null;
};

export function useDayMachines(dayIndex: number) {
    const [machines, setMachines] = useState<MachineWithHistory[]>([]);

    const setMachinesFromData = useCallback(
        (data: {
            days: Record<number, string[]>;
            machines: Record<string, Machine>;
            history: Record<string, HistoryEntry[]>;
        }) => {
            const ids = data.days[dayIndex] ?? [];
            const list = ids
                .map((id) => {
                    const machine = data.machines[id];
                    if (!machine) return null;
                    const hist = data.history[id] ?? [];
                    const lastSets = hist[0]?.sets ?? null;
                    const recordSets = getRecordHistoryEntry(hist)?.sets ?? null;
                    const lastWeight =
                        lastSets && lastSets.length > 0
                            ? Math.max(...lastSets.map((set) => set.weight))
                            : null;
                    return { ...machine, lastWeight, lastSets, recordSets };
                })
                .filter(Boolean) as MachineWithHistory[];
            setMachines(list);
        },
        [dayIndex],
    );

    const refresh = useCallback(async () => {
        const cachedData = await getCachedWorkoutData();
        setMachinesFromData(cachedData);

        const data = await loadWorkoutData();
        setMachinesFromData(data);
    }, [setMachinesFromData]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { machines, refresh };
}
