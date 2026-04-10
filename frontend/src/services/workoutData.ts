import { getCategoryByKey } from "../constants/categories";
import { AppData } from "../dtos/AppData";
import { HistoryEntry } from "../dtos/HistoryEntry";
import { Machine } from "../dtos/Machine";
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
        sets: entry.sets,
        date: entry.date,
        label: "",
    };
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

    await syncNotifications(daysMachines, (key) => getCategoryByKey(key).label);
}

async function markSynced() {
    lastSyncedCacheKey = await getDataCacheKey();
}

export async function getCachedWorkoutData() {
    return getData();
}

export async function loadWorkoutData(options?: { forceSync?: boolean }) {
    const cachedData = await getData();
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
    const data = await getData();

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
    const data = await getData();

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
    const data = await getData();

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
    const data = await getData();

    data.machines[machine.id] = {
        ...(data.machines[machine.id] ?? machine),
        ...machine,
    };
    await saveData(data);

    await markSynced();

    return machine.photo || undefined;
}
