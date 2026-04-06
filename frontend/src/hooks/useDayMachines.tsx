import { useCallback, useEffect, useState } from "react";
import { Machine } from "../dtos/Machine";
import { getData } from "../services/storage";

type MachineWithHistory = Machine & {
    lastWeight: number | null;
    lastSets: [number, number, number] | null;
};

export function useDayMachines(dayIndex: number) {
    const [machines, setMachines] = useState<MachineWithHistory[]>([]);

    const refresh = useCallback(async () => {
        const data = await getData();
        const ids = data.days[dayIndex] ?? [];
        const list = ids
            .map((id) => {
                const m = data.machines[id];
                if (!m) return null;
                const hist = data.history[id] ?? [];
                const lastSets = hist[0]?.sets ?? null;
                const lastWeight = lastSets ? Math.max(...lastSets) : null;
                return { ...m, lastWeight, lastSets };
            })
            .filter(Boolean) as MachineWithHistory[];
        setMachines(list);
    }, [dayIndex]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { machines, refresh };
}
