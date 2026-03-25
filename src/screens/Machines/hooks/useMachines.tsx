import { useCallback, useEffect, useState } from "react";
import { Machine } from "../types";
import { getData, saveData, uid } from "@/src/hooks/useStorage";

export function useMachines(categoryId: string) {
  const [machines, setMachines] = useState<Machine[]>([]);

  const refreshMachines = useCallback(async () => {
    const data = await getData();
    const list = (data.machines[categoryId] ?? []).map((m) => {
      const hist = data.history[m.id] ?? [];
      const last = hist[0];
      const maxWeight = last ? Math.max(...last.sets) : null;
      return { ...m, currentWeight: maxWeight };
    });
    setMachines(list);
  }, [categoryId]);

  useEffect(() => { refreshMachines(); }, [refreshMachines]);

  const addMachine = useCallback(async (name: string) => {
    const data = await getData();
    const machine: Machine = { id: uid(), name, currentWeight: null };
    if (!data.machines[categoryId]) data.machines[categoryId] = [];
    data.machines[categoryId].push(machine);
    data.history[machine.id] = [];
    await saveData(data);
    refreshMachines();
  }, [categoryId, refreshMachines]);

  const deleteMachine = useCallback(async (machineId: string) => {
    const data = await getData();
    data.machines[categoryId] = (data.machines[categoryId] ?? []).filter((m) => m.id !== machineId);
    delete data.history[machineId];
    await saveData(data);
    refreshMachines();
  }, [categoryId, refreshMachines]);

  return { machines, addMachine, deleteMachine };
}