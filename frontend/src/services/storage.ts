import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppData } from "../dtos/AppData";
import { Machine } from "../dtos/Machine";

const STORAGE_KEY = "fitcha_data";

export const uid = () => Math.random().toString(36).slice(2, 10);
let cache: AppData | null = null;

export async function getData(): Promise<AppData> {
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

export async function saveData(data: AppData) {
    cache = data;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function replaceWeekWithMachines(days: Record<number, Machine[]>) {
    const data = await getData();
    const nextData: AppData = {
        machines: {},
        days: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
        history: {},
    };

    Object.entries(days).forEach(([dayIndex, machines]) => {
        const numericDay = Number(dayIndex);
        nextData.days[numericDay] = machines.map((machine) => {
            nextData.machines[machine.id] = machine;
            nextData.history[machine.id] = data.history[machine.id] ?? [];
            return machine.id;
        });
    });

    await saveData(nextData);
}
