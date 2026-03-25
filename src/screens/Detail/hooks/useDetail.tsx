import { getData, saveData, uid } from "@/src/hooks/useStorage";
import { useCallback, useEffect, useState } from "react";
import { formatDateLabel } from "../helpers";
import { HistoryEntry } from "../types";

export function useMachineDetail(categoryId: string, machineId: string) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentSets, setCurrentSets] = useState<[number, number, number] | null>(null);
  const [photo, setPhoto] = useState<string | undefined>(undefined);

  const refreshHistory = useCallback(async () => {
    const data = await getData();
    const entries = (data.history[machineId] ?? []).map((e) => ({
      ...e, label: formatDateLabel(e.date),
    }));
    setHistory(entries);
    setCurrentSets(entries[0]?.sets ?? null);
  }, [machineId]);

  useEffect(() => {
    getData().then((data) => {
      const machine = (data.machines[categoryId] ?? []).find((m) => m.id === machineId);
      setPhoto(machine?.photo);
    });
    refreshHistory();
  }, [machineId, refreshHistory]);

  const updatePhoto = useCallback(async (uri: string) => {
    const data = await getData();
    const machines = data.machines[categoryId] ?? [];
    const idx = machines.findIndex((m) => m.id === machineId);
    if (idx !== -1) { machines[idx].photo = uri; await saveData(data); setPhoto(uri); }
  }, [categoryId, machineId]);

  const removePhoto = useCallback(async () => {
    const data = await getData();
    const machines = data.machines[categoryId] ?? [];
    const idx = machines.findIndex((m) => m.id === machineId);
    if (idx !== -1) { delete machines[idx].photo; await saveData(data); setPhoto(undefined); }
  }, [categoryId, machineId]);

  const addEntry = useCallback(async (sets: [number, number, number]) => {
    const data = await getData();
    const entry: HistoryEntry = { id: uid(), sets, date: new Date().toISOString(), label: "hoje" };
    if (!data.history[machineId]) data.history[machineId] = [];
    data.history[machineId].unshift(entry);
    await saveData(data);
    refreshHistory();
  }, [machineId, refreshHistory]);

  const deleteHistoryEntry = useCallback(async (entryId: string) => {
    const data = await getData();
    data.history[machineId] = (data.history[machineId] ?? []).filter((e) => e.id !== entryId);
    await saveData(data);
    refreshHistory();
  }, [machineId, refreshHistory]);

  return { currentSets, history, photo, addEntry, updatePhoto, removePhoto, deleteHistoryEntry };
}