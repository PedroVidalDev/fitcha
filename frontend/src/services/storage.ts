import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppData } from "../dtos/AppData";

const STORAGE_KEY = "fitcha_data";
const AUTH_SESSION_KEY = "auth_session";

let cache: AppData | null = null;
let cacheKey: string | null = null;
let hasPersistedValue = false;

export function createEmptyAppData(): AppData {
    return {
        machines: {},
        days: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
        history: {},
    };
}

async function resolveStorageKey() {
    const rawSession = await AsyncStorage.getItem(AUTH_SESSION_KEY);

    if (!rawSession) return STORAGE_KEY;

    try {
        const session = JSON.parse(rawSession) as { user?: { id?: number | string } } | null;
        const userId = session?.user?.id;

        if (typeof userId === "number" || typeof userId === "string") {
            return `${STORAGE_KEY}:${userId}`;
        }
    } catch {
        return STORAGE_KEY;
    }

    return STORAGE_KEY;
}

async function loadState(): Promise<{ data: AppData; hasPersistedValue: boolean }> {
    const nextKey = await resolveStorageKey();

    if (cacheKey !== nextKey) {
        cache = null;
        cacheKey = nextKey;
        hasPersistedValue = false;
    }

    if (cache) {
        return { data: cache, hasPersistedValue };
    }

    const raw = await AsyncStorage.getItem(nextKey);
    if (raw) {
        cache = JSON.parse(raw) as AppData;
        hasPersistedValue = true;
        return { data: cache, hasPersistedValue };
    }

    if (nextKey !== STORAGE_KEY) {
        const legacyRaw = await AsyncStorage.getItem(STORAGE_KEY);
        if (legacyRaw) {
            cache = JSON.parse(legacyRaw) as AppData;
            hasPersistedValue = true;
            await AsyncStorage.setItem(nextKey, legacyRaw);
            await AsyncStorage.removeItem(STORAGE_KEY);
            return { data: cache, hasPersistedValue };
        }
    }

    cache = createEmptyAppData();
    hasPersistedValue = false;
    return { data: cache, hasPersistedValue };
}

export async function getData(): Promise<AppData> {
    const state = await loadState();
    return state.data;
}

export async function hasStoredData() {
    const state = await loadState();
    return state.hasPersistedValue;
}

export async function getDataCacheKey() {
    return resolveStorageKey();
}

export async function saveData(data: AppData) {
    const key = await resolveStorageKey();
    cacheKey = key;
    cache = data;
    hasPersistedValue = true;
    await AsyncStorage.setItem(key, JSON.stringify(data));
}

export async function clearData() {
    const key = await resolveStorageKey();
    cacheKey = key;
    cache = createEmptyAppData();
    hasPersistedValue = false;
    await AsyncStorage.removeItem(key);
}
