import { useCallback } from "react";
import { HistoryEntry } from "../../../dtos/HistoryEntry";
import { getData, saveData, uid } from "../../../services/storage";

export function useSaveWorkout() {
    return useCallback(async (results: { machineId: string; sets: [number, number, number] }[]) => {
        const data = await getData();
        const now = new Date().toISOString();
        for (const r of results) {
            const entry: HistoryEntry = { id: uid(), sets: r.sets, date: now, label: "hoje" };
            if (!data.history[r.machineId]) data.history[r.machineId] = [];
            data.history[r.machineId].unshift(entry);
        }
        await saveData(data);
    }, []);
}
