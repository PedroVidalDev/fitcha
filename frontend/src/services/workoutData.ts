import { getCategoryByKey } from "../constants/categories";
import { AppData } from "../dtos/AppData";
import { HistoryEntry, HistorySet } from "../dtos/HistoryEntry";
import { Machine } from "../dtos/Machine";
import { translateRuntime } from "../translates/runtime";
import {
    addMachineToDay as addMachineToDayRequest,
    DayMachineInput,
    DayResponse,
    getMyDays,
    removeMachineFromDay as removeMachineFromDayRequest,
    replaceWeek,
    ReplaceWeekDayInput,
} from "./days";
import {
    createWorkoutHistory,
    getMyHistory,
    HistoryApiEntry,
    WorkoutHistoryInput,
} from "./history";
import { getMyMachines, updateMachine } from "./machines";
import { syncNotifications } from "./notifications";
import { createEmptyAppData, getData, getDataCacheKey, saveData } from "./storage";

let syncPromise: Promise<AppData> | null = null;
let lastSyncedCacheKey: string | null = null;

export function resetWorkoutSyncState() {
    syncPromise = null;
    lastSyncedCacheKey = null;
}

function buildAppData(
    machines: Machine[],
    days: DayResponse[],
    historyEntries: HistoryApiEntry[],
): AppData {
    const data = createEmptyAppData();

    machines.forEach((machine) => {
        data.machines[machine.id] = machine;
    });

    days.forEach((day) => {
        data.days[day.dayIndex] = [...day.machineIds];
    });

    historyEntries.forEach((entry) => {
        if (!data.history[entry.machineId]) {
            data.history[entry.machineId] = [];
        }

        data.history[entry.machineId].push(toHistoryEntry(entry));
    });

    return data;
}

function toHistoryEntry(entry: HistoryApiEntry): HistoryEntry {
    return {
        id: entry.id,
        sets: entry.sets.map((set) => ({
            weight: set.weight,
            reps: set.reps,
        })),
        date: entry.date,
        label: "",
    };
}

function normalizeHistorySet(value: unknown): HistorySet | null {
    if (typeof value === "number") {
        if (!Number.isFinite(value) || value <= 0) return null;

        return {
            weight: value,
            reps: 0,
        };
    }

    if (!value || typeof value !== "object") {
        return null;
    }

    const rawWeight = "weight" in value ? (value as { weight?: unknown }).weight : undefined;
    const rawReps = "reps" in value ? (value as { reps?: unknown }).reps : undefined;
    const weight =
        typeof rawWeight === "number"
            ? rawWeight
            : typeof rawWeight === "string"
              ? Number(rawWeight)
              : Number.NaN;
    const reps =
        typeof rawReps === "number" ? rawReps : typeof rawReps === "string" ? Number(rawReps) : 0;

    if (!Number.isFinite(weight) || weight <= 0) {
        return null;
    }

    return {
        weight,
        reps: Number.isFinite(reps) && reps > 0 ? Math.trunc(reps) : 0,
    };
}

function normalizeHistoryEntry(entry: unknown): { entry: HistoryEntry | null; changed: boolean } {
    if (!entry || typeof entry !== "object") {
        return { entry: null, changed: false };
    }

    const candidate = entry as Partial<HistoryEntry> & {
        sets?: unknown;
        label?: unknown;
    };

    if (typeof candidate.id !== "string" || typeof candidate.date !== "string") {
        return { entry: null, changed: false };
    }

    const rawSets = Array.isArray(candidate.sets) ? candidate.sets : [];
    const sets = rawSets.map(normalizeHistorySet).filter((set): set is HistorySet => set !== null);
    const normalizedEntry: HistoryEntry = {
        id: candidate.id,
        sets,
        date: candidate.date,
        label: typeof candidate.label === "string" ? candidate.label : "",
    };

    const changed =
        !Array.isArray(candidate.sets) ||
        rawSets.length !== sets.length ||
        rawSets.some((set, index) => {
            if (typeof set === "number") {
                return true;
            }

            if (!set || typeof set !== "object") {
                return true;
            }

            const current = sets[index];
            if (!current) {
                return true;
            }

            return (
                (set as { weight?: unknown }).weight !== current.weight ||
                (set as { reps?: unknown }).reps !== current.reps
            );
        }) ||
        typeof candidate.label !== "string";

    return { entry: normalizedEntry, changed };
}

function normalizeAppData(data: AppData): { data: AppData; changed: boolean } {
    let changed = false;
    const nextData: AppData = {
        machines: data.machines,
        days: data.days,
        history: {},
    };

    Object.entries(data.history).forEach(([machineId, entries]) => {
        const normalizedEntries: HistoryEntry[] = [];

        entries.forEach((entry) => {
            const normalized = normalizeHistoryEntry(entry);
            if (!normalized.entry) {
                changed = true;
                return;
            }

            if (normalized.changed) {
                changed = true;
            }

            normalizedEntries.push(normalized.entry);
        });

        nextData.history[machineId] = normalizedEntries;
    });

    return { data: nextData, changed };
}

async function getNormalizedData() {
    const data = await getData();
    const normalized = normalizeAppData(data);

    if (normalized.changed) {
        await saveData(normalized.data);
    }

    return normalized.data;
}

async function syncDayNotifications(data: AppData) {
    const daysMachines: Record<number, { categoryKey: string }[]> = {
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
    };

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        daysMachines[dayIndex] = (data.days[dayIndex] ?? [])
            .map((machineId) => data.machines[machineId])
            .filter((machine): machine is Machine => Boolean(machine));
    }

    await syncNotifications(daysMachines, (key) =>
        translateRuntime(getCategoryByKey(key).labelKey),
    );
}

async function markSynced() {
    lastSyncedCacheKey = await getDataCacheKey();
}

export async function getCachedWorkoutData() {
    return getNormalizedData();
}

export async function loadWorkoutData(options?: { forceSync?: boolean }) {
    const cachedData = await getNormalizedData();
    const currentCacheKey = await getDataCacheKey();
    const shouldSync = options?.forceSync || lastSyncedCacheKey !== currentCacheKey;

    if (!shouldSync) {
        return cachedData;
    }

    try {
        return await syncWorkoutData();
    } catch {
        return cachedData;
    }
}

export async function syncWorkoutData() {
    if (syncPromise) {
        return syncPromise;
    }

    syncPromise = (async () => {
        const [machines, days, historyEntries] = await Promise.all([
            getMyMachines(),
            getMyDays(),
            getMyHistory(),
        ]);

        const nextData = buildAppData(machines, days, historyEntries);
        await saveData(nextData);
        await markSynced();
        await syncDayNotifications(nextData);
        return nextData;
    })();

    try {
        return await syncPromise;
    } finally {
        syncPromise = null;
    }
}

export async function addMachineToDay(dayIndex: number, input: DayMachineInput) {
    const response = await addMachineToDayRequest(dayIndex, input);
    const data = await getNormalizedData();

    data.machines[response.machine.id] = response.machine;
    data.days[response.day.dayIndex] = [...response.day.machineIds];
    data.history[response.machine.id] = data.history[response.machine.id] ?? [];

    await saveData(data);
    await markSynced();
    await syncDayNotifications(data);

    return response.machine;
}

export async function removeMachineFromDay(dayIndex: number, machineId: string) {
    const response = await removeMachineFromDayRequest(dayIndex, machineId);
    const data = await getNormalizedData();

    data.days[response.day.dayIndex] = [...response.day.machineIds];

    if (response.removedMachine) {
        delete data.machines[machineId];
        delete data.history[machineId];
    }

    await saveData(data);
    await markSynced();
    await syncDayNotifications(data);
}

export async function replaceWeekWithMachines(days: Record<number, DayMachineInput[]>) {
    const payload: ReplaceWeekDayInput[] = Object.entries(days).map(([dayIndex, machines]) => ({
        dayIndex: Number(dayIndex),
        machines,
    }));

    const response = await replaceWeek(payload);
    const nextData = createEmptyAppData();

    response.machines.forEach((machine) => {
        nextData.machines[machine.id] = machine;
    });

    response.days.forEach((day) => {
        nextData.days[day.dayIndex] = [...day.machineIds];
    });

    await saveData(nextData);
    await markSynced();
    await syncDayNotifications(nextData);

    return nextData;
}

export async function saveWorkoutResults(results: WorkoutHistoryInput[]) {
    const createdEntries = await createWorkoutHistory(results);
    const data = await getNormalizedData();

    createdEntries.forEach((entry) => {
        if (!data.history[entry.machineId]) {
            data.history[entry.machineId] = [];
        }

        data.history[entry.machineId].unshift(toHistoryEntry(entry));
    });

    await saveData(data);
    await markSynced();

    return createdEntries.map(toHistoryEntry);
}

export async function updateMachinePhoto(machineId: string, photo?: string) {
    const machine = await updateMachine(machineId, {
        photo: photo ?? "",
    });
    const data = await getNormalizedData();

    data.machines[machine.id] = {
        ...(data.machines[machine.id] ?? machine),
        ...machine,
    };
    await saveData(data);

    await markSynced();

    return machine.photo || undefined;
}
