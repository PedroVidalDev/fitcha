import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppData } from '../dtos/AppData'

const STORAGE_KEY = 'fitcha_data'
const AUTH_SESSION_KEY = 'auth_session'

let cache: AppData | null = null
let cacheKey: string | null = null
let hasPersistedValue = false

export function createEmptyAppData(): AppData {
    return {
        machines: {},
        workouts: {},
        workoutOrder: [],
        historySummary: {
            workoutDates: [],
            byMachine: {},
        },
    }
}

export async function getScopedStorageKey(baseKey: string) {
    const rawSession = await AsyncStorage.getItem(AUTH_SESSION_KEY)

    if (!rawSession) return baseKey

    try {
        const session = JSON.parse(rawSession) as {
            user?: { id?: number | string }
        } | null
        const userId = session?.user?.id

        if (typeof userId === 'number' || typeof userId === 'string') {
            return `${baseKey}:${userId}`
        }
    } catch {
        return baseKey
    }

    return baseKey
}

async function resolveStorageKey() {
    return getScopedStorageKey(STORAGE_KEY)
}

async function loadState(): Promise<{
    data: AppData
    hasPersistedValue: boolean
}> {
    const nextKey = await resolveStorageKey()

    if (cacheKey !== nextKey) {
        cache = null
        cacheKey = nextKey
        hasPersistedValue = false
    }

    if (cache) {
        return { data: cache, hasPersistedValue }
    }

    const raw = await AsyncStorage.getItem(nextKey)
    if (raw) {
        try {
            cache = JSON.parse(raw) as AppData
            hasPersistedValue = true
            return { data: cache, hasPersistedValue }
        } catch {
            await AsyncStorage.removeItem(nextKey)
        }
    }

    if (nextKey !== STORAGE_KEY) {
        const legacyRaw = await AsyncStorage.getItem(STORAGE_KEY)
        if (legacyRaw) {
            try {
                cache = JSON.parse(legacyRaw) as AppData
                hasPersistedValue = true
                await AsyncStorage.setItem(nextKey, legacyRaw)
                await AsyncStorage.removeItem(STORAGE_KEY)
                return { data: cache, hasPersistedValue }
            } catch {
                await AsyncStorage.removeItem(STORAGE_KEY)
            }
        }
    }

    cache = createEmptyAppData()
    hasPersistedValue = false
    return { data: cache, hasPersistedValue }
}

export async function getData(): Promise<AppData> {
    const state = await loadState()
    return state.data
}

export async function hasStoredData() {
    const state = await loadState()
    return state.hasPersistedValue
}

export async function getDataCacheKey() {
    return resolveStorageKey()
}

export async function saveData(data: AppData) {
    const key = await resolveStorageKey()
    cacheKey = key
    cache = data
    hasPersistedValue = true

    try {
        await AsyncStorage.setItem(key, JSON.stringify(data))
    } catch {
        // Local cache is best-effort; a write failure must not break flows.
    }
}

export async function clearData() {
    const key = await resolveStorageKey()
    cacheKey = key
    cache = createEmptyAppData()
    hasPersistedValue = false
    await AsyncStorage.removeItem(key)
}
