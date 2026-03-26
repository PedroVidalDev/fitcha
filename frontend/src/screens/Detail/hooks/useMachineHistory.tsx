import { useEffect, useState } from "react";
import { HistoryEntry } from "../../../dtos/HistoryEntry";
import { Machine } from "../../../dtos/Machine";
import { formatDateLabel, getData } from "../../../services/storage";

export function useMachineHistory(machineId: string) {
    const [machine, setMachine] = useState<Machine | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    useEffect(() => {
        getData().then((data) => {
            setMachine(data.machines[machineId] ?? null);
            const entries = (data.history[machineId] ?? []).map((e) => ({
                ...e,
                label: formatDateLabel(e.date),
            }));
            setHistory(entries);
        });
    }, [machineId]);

    return { machine, history };
}
