import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { getCategoryByKey, MachineCategoryKey } from "../constants/categories";
import { syncNotifications } from "../services/notifications";

const STORAGE_KEY = "fitcha_data";

export type Machine = {
    id: string;
    name: string;
    description?: string;
    photo?: string;
    categoryKey: MachineCategoryKey;
};

export type HistoryEntry = {
    id: string;
    sets: [number, number, number];
    date: string;
    label: string;
};

// Cada dia da semana (0-6) tem uma lista de machineIds
type AppData = {
    machines: Record<string, Machine>; // machineId → Machine
    days: Record<number, string[]>; // dayIndex → machineIds
    history: Record<string, HistoryEntry[]>; // machineId → entries
};

const uid = () => Math.random().toString(36).slice(2, 10);
let cache: AppData | null = null;

async function getData(): Promise<AppData> {
    if (cache) return cache;
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
        cache = JSON.parse(raw);
    } else {
        cache = {
            machines: {},
            days: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
            history: {},
        };
    }
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

// ── Hook: Semana (tela 1) ──
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

    useEffect(() => {
        refresh();
    }, [refresh]);

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

    return { days, addMachineToDay, removeMachineFromDay, refresh };
}

// ── Hook: Máquinas de um dia (tela 2) ──
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

// ── Hook: Detalhe da máquina (tela 3, read-only) ──
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

// ── Hook: Foto da máquina ──
export function useMachinePhoto(machineId: string) {
    const [photo, setPhoto] = useState<string | undefined>();

    useEffect(() => {
        getData().then((data) => setPhoto(data.machines[machineId]?.photo));
    }, [machineId]);

    const updatePhoto = useCallback(
        async (uri: string) => {
            const data = await getData();
            if (data.machines[machineId]) {
                data.machines[machineId].photo = uri;
                await saveData(data);
                setPhoto(uri);
            }
        },
        [machineId],
    );

    const removePhoto = useCallback(async () => {
        const data = await getData();
        if (data.machines[machineId]) {
            delete data.machines[machineId].photo;
            await saveData(data);
            setPhoto(undefined);
        }
    }, [machineId]);

    return { photo, updatePhoto, removePhoto };
}

// ── Hook: Salvar treino (tela 4) ──
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
