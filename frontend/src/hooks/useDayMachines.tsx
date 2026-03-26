import { useCallback, useEffect, useState } from "react";
import { Machine } from "../dtos/Machine";
import { getData } from "../services/storage";

export function useDayMachines(dayIndex: number) {
    const [machines, setMachines] = useState<(Machine & { lastWeight: number | null })[]>([]);

    const refresh = useCallback(async () => {
        const data = await getData();
        const ids = data.days[dayIndex] ?? [];
        const list = ids
            .map((id) => {
                const m = data.machines[id];
                if (!m) return null;
                const hist = data.history[id] ?? [];
                const lastWeight = hist[0] ? Math.max(...hist[0].sets) : null;
                return { ...m, lastWeight };
            })
            .filter(Boolean) as (Machine & { lastWeight: number | null })[];
        setMachines(list);
    }, [dayIndex]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { machines, refresh };
}
