import { useCallback, useEffect, useState } from "react";
import { getCategoryByKey, MachineCategoryKey } from "../constants/categories";
import { Machine } from "../dtos/Machine";
import { syncNotifications } from "../services/notifications";
import { getData, saveData, uid } from "../services/storage";

export function useWeek() {
    const [days, setDays] = useState<Record<number, Machine[]>>({});

    const refresh = useCallback(async () => {
        const data = await getData();
        const result: Record<number, Machine[]> = {};
        for (let i = 0; i < 7; i++) {
            const ids = data.days[i] ?? [];
            result[i] = ids.map((id) => data.machines[id]).filter(Boolean);
        }
        setDays(result);
    }, []);

    const syncNotifs = async () => {
        const data = await getData();
        const daysMachines: Record<number, { categoryKey: string }[]> = {};
        for (let i = 0; i < 7; i++) {
            daysMachines[i] = (data.days[i] ?? []).map((id) => data.machines[id]).filter(Boolean);
        }
        syncNotifications(daysMachines, (key) => getCategoryByKey(key).label);
    };

    const addMachineToDay = useCallback(
        async (
            dayIndex: number,
            name: string,
            categoryKey: MachineCategoryKey,
            description?: string,
        ) => {
            const data = await getData();
            const id = uid();
            data.machines[id] = { id, name, categoryKey, description };
            if (!data.days[dayIndex]) data.days[dayIndex] = [];
            data.days[dayIndex].push(id);
            data.history[id] = [];
            await saveData(data);
            await syncNotifs();
            refresh();
        },
        [refresh],
    );

    const removeMachineFromDay = useCallback(
        async (dayIndex: number, machineId: string) => {
            const data = await getData();
            data.days[dayIndex] = (data.days[dayIndex] ?? []).filter((id) => id !== machineId);
            const usedElsewhere = Object.values(data.days).some((ids) => ids.includes(machineId));
            if (!usedElsewhere) {
                delete data.machines[machineId];
                delete data.history[machineId];
            }
            await saveData(data);
            await syncNotifs();
            refresh();
        },
        [refresh],
    );

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { days, addMachineToDay, removeMachineFromDay, refresh };
}
