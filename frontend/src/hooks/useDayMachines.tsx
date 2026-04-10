import { useCallback, useEffect, useState } from "react";
import { Machine } from "../dtos/Machine";
import { getCachedWorkoutData, loadWorkoutData } from "../services/workoutData";

type MachineWithHistory = Machine & {
    lastWeight: number | null;
    lastSets: [number, number, number] | null;
};

export function useDayMachines(dayIndex: number) {
    const [machines, setMachines] = useState<MachineWithHistory[]>([]);

    const setMachinesFromData = useCallback(
        (data: {
            days: Record<number, string[]>;
            machines: Record<string, Machine>;
            history: Record<string, { sets: [number, number, number] }[]>;
        }) => {
            const ids = data.days[dayIndex] ?? [];
            const list = ids
                .map((id) => {
                    const machine = data.machines[id];
                    if (!machine) return null;
                    const hist = data.history[id] ?? [];
                    const lastSets = hist[0]?.sets ?? null;
                    const lastWeight = lastSets ? Math.max(...lastSets) : null;
                    return { ...machine, lastWeight, lastSets };
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
