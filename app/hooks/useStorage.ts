import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "app_data";

// ── Types ──
type Category = { id: string; name: string; machineCount: number };
type Machine = { id: string; name: string; currentWeight: number | null };
type HistoryEntry = {
  id: string;
  sets: [number, number, number]; // peso de cada uma das 3 séries
  date: string;
  label: string;
};
type AppData = {
  categories: Category[];
  machines: Record<string, Machine[]>;
  history: Record<string, HistoryEntry[]>;
};

// ── Helpers ──
const uid = () => Math.random().toString(36).slice(2, 10);

let cache: AppData | null = null;

async function getData(): Promise<AppData> {
  if (cache) return cache;
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  cache = raw ? JSON.parse(raw) : { categories: [], machines: {}, history: {} };
  return cache!;
}

async function saveData(data: AppData) {
  cache = data;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "hoje";
  if (diff === 1) return "ontem";
  if (diff < 7) return `${diff} dias atrás`;
  if (diff < 14) return "1 semana";
  if (diff < 30) return `${Math.floor(diff / 7)} semanas`;
  return d.toLocaleDateString("pt-BR");
}

// ── Hook: Categorias ──
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getData().then((data) => {
      const cats = data.categories.map((c) => ({
        ...c,
        machineCount: (data.machines[c.id] ?? []).length,
      }));
      setCategories(cats);
    });
  }, []);

  const addCategory = useCallback(async (name: string) => {
    const data = await getData();
    const cat: Category = { id: uid(), name, machineCount: 0 };
    data.categories.push(cat);
    data.machines[cat.id] = [];
    await saveData(data);
    setCategories([...data.categories]);
  }, []);

  return { categories, addCategory };
}

// ── Hook: Máquinas ──
export function useMachines(categoryId: string) {
  const [machines, setMachines] = useState<Machine[]>([]);

  useEffect(() => {
    getData().then((data) => {
      const list = (data.machines[categoryId] ?? []).map((m) => {
        const hist = data.history[m.id] ?? [];
        const last = hist[0];
        const maxWeight = last ? Math.max(...last.sets) : null;
        return { ...m, currentWeight: maxWeight };
      });
      setMachines(list);
    });
  }, [categoryId]);

  const addMachine = useCallback(
    async (name: string) => {
      const data = await getData();
      const machine: Machine = { id: uid(), name, currentWeight: null };
      if (!data.machines[categoryId]) data.machines[categoryId] = [];
      data.machines[categoryId].push(machine);
      data.history[machine.id] = [];
      await saveData(data);
      setMachines([...data.machines[categoryId]]);
    },
    [categoryId]
  );

  return { machines, addMachine };
}

// ── Hook: Detalhe da Máquina ──
export function useMachineDetail(categoryId: string, machineId: string) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentSets, setCurrentSets] = useState<[number, number, number] | null>(null);

  useEffect(() => {
    getData().then((data) => {
      const entries = (data.history[machineId] ?? []).map((e) => ({
        ...e,
        label: formatDateLabel(e.date),
      }));
      setHistory(entries);
      setCurrentSets(entries[0]?.sets ?? null);
    });
  }, [machineId]);

  const addEntry = useCallback(
    async (sets: [number, number, number]) => {
      const data = await getData();
      const entry: HistoryEntry = {
        id: uid(),
        sets,
        date: new Date().toISOString(),
        label: "hoje",
      };
      if (!data.history[machineId]) data.history[machineId] = [];
      data.history[machineId].unshift(entry);
      await saveData(data);

      const entries = data.history[machineId].map((e) => ({
        ...e,
        label: formatDateLabel(e.date),
      }));
      setHistory(entries);
      setCurrentSets(sets);
    },
    [machineId]
  );

  return { currentSets, history, addEntry };
}