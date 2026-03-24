import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  scheduleWeeklyNotifications,
  cancelCategoryNotifications,
} from "../services/notifications";
const STORAGE_KEY = "app_data";

type Category = { id: string; name: string; machineCount: number; days: number[] };
type Machine = { id: string; name: string; currentWeight: number | null; photo?: string };
type HistoryEntry = { id: string; sets: [number, number, number]; date: string; label: string };
type AppData = {
  categories: Category[];
  machines: Record<string, Machine[]>;
  history: Record<string, HistoryEntry[]>;
};

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

// ── Categorias ──
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getData().then((data) => {
      const cats = data.categories.map((c) => ({
        ...c, machineCount: (data.machines[c.id] ?? []).length,
      }));
      setCategories(cats);
    });
  }, []);

  const updateCategoryDays = useCallback(async (categoryId: string, days: number[]) => {
    const data = await getData();
    const cat = data.categories.find((c) => c.id === categoryId);
    if (cat) {
      cat.days = days;
      await saveData(data);
      setCategories(data.categories.map((c) => ({
        ...c, machineCount: (data.machines[c.id] ?? []).length,
      })));
      
      await scheduleWeeklyNotifications(categoryId, cat.name, days);
    }
  }, []);

  const addCategory = useCallback(async (name: string, days: number[]) => {
    const data = await getData();
    const cat: Category = { id: uid(), name, machineCount: 0, days };
    data.categories.push(cat);
    data.machines[cat.id] = [];
    await saveData(data);
    setCategories(data.categories.map((c) => ({
      ...c, machineCount: (data.machines[c.id] ?? []).length,
    })));

    await scheduleWeeklyNotifications(cat.id, name, days);
  }, []);

  const deleteCategory = useCallback(async (categoryId: string) => {
    const data = await getData();
    // remove históricos de todas as máquinas da categoria
    const machines = data.machines[categoryId] ?? [];
    for (const m of machines) {
      delete data.history[m.id];
    }
    // remove máquinas e categoria
    delete data.machines[categoryId];
    data.categories = data.categories.filter((c) => c.id !== categoryId);
    await saveData(data);
    setCategories(data.categories.map((c) => ({
      ...c, machineCount: (data.machines[c.id] ?? []).length,
    })));

    await cancelCategoryNotifications(categoryId);
  }, []);

  return { categories, addCategory, deleteCategory, updateCategoryDays };
}

// ── Máquinas ──
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

// ── Detalhe da Máquina ──
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