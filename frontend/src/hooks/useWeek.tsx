import { useCallback, useEffect, useState } from "react";
import { MachineCategoryKey } from "../constants/categories";
import { Machine } from "../dtos/Machine";
import {
    addMachineToDay as addMachineToDayRequest,
    getCachedWorkoutData,
    loadWorkoutData,
    removeMachineFromDay as removeMachineFromDayRequest,
} from "../services/workoutData";

export function useWeek() {
    const [days, setDays] = useState<Record<number, Machine[]>>({});

    const setDaysFromData = useCallback(
        (data: { days: Record<number, string[]>; machines: Record<string, Machine> }) => {
            const result: Record<number, Machine[]> = {};

            for (let i = 0; i < 7; i++) {
                const ids = data.days[i] ?? [];
                result[i] = ids.map((id) => data.machines[id]).filter(Boolean);
            }

            setDays(result);
        },
        [],
    );

    const refresh = useCallback(async () => {
        const cachedData = await getCachedWorkoutData();
        setDaysFromData(cachedData);

        const data = await loadWorkoutData();
        setDaysFromData(data);
    }, [setDaysFromData]);

    const addMachineToDay = useCallback(
        async (
            dayIndex: number,
            name: string,
            categoryKey: MachineCategoryKey,
            description?: string,
        ) => {
            await addMachineToDayRequest(dayIndex, {
                name,
                categoryKey,
                description,
            });
            await refresh();
        },
        [refresh],
    );

    const removeMachineFromDay = useCallback(
        async (dayIndex: number, machineId: string) => {
            await removeMachineFromDayRequest(dayIndex, machineId);
            await refresh();
        },
        [refresh],
    );

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { days, addMachineToDay, removeMachineFromDay, refresh };
}
