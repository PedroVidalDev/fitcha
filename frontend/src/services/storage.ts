import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppData } from '../dtos/AppData'
import { HistorySummary } from '../dtos/HistorySummary'
import { Machine } from '../dtos/Machine'
import { WorkoutPlan } from '../dtos/WorkoutPlan'

const AUTH_SESSION_KEY = 'auth_session'

const LEGACY_STORAGE_KEY = 'fitcha_data'
const WORKOUTS_KEY = 'fitcha_data:workouts'
const MACHINES_KEY = 'fitcha_data:machines'
const HISTORY_SUMMARY_KEY = 'fitcha_data:historySummary'

// Disposable cache that can be cleared to free space when storage is full.
// Kept in sync with the key defined in `machineCache.ts`.
const MACHINE_ENTITIES_CACHE_KEY = 'fitcha_machine_entities_v1'

type WorkoutsPart = {
    workouts: Record<string, WorkoutPlan>
    workoutOrder: number[]
}

type MachinesPart = {
    machines: Record<string, Machine>
}

type HistorySummaryPart = {
    historySummary: HistorySummary
}

type LegacyStoredData = Partial<AppData> & {
    days?: Record<number, string[]>
    history?: unknown
}

let cache: AppData | null = null
let cacheScopeKey: string | null = null
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

async function resolveScopeKey() {
    return getScopedStorageKey(LEGACY_STORAGE_KEY)
}

function isStorageFullError(error: unknown): boolean {
    if (!(error instanceof Error)) return false

    const message = error.message ?? ''

    return /sqlite_full|database or disk is full|quota exceeded/i.test(message)
}

async function clearDisposableCaches() {
    const scopedKey = await getScopedStorageKey(MACHINE_ENTITIES_CACHE_KEY)
    await AsyncStorage.removeItem(scopedKey).catch(() => undefined)
}

async function readPart<T>(key: string): Promise<T | null> {
    const scopedKey = await getScopedStorageKey(key)
    const raw = await AsyncStorage.getItem(scopedKey)

    if (!raw) return null

    try {
        return JSON.parse(raw) as T
    } catch {
        await AsyncStorage.removeItem(scopedKey)
        return null
    }
}

async function writePart(key: string, value: unknown) {
    const scopedKey = await getScopedStorageKey(key)

    try {
        await AsyncStorage.setItem(scopedKey, JSON.stringify(value))
    } catch (error) {
        if (!isStorageFullError(error)) return

        await clearDisposableCaches()

        try {
            await AsyncStorage.setItem(scopedKey, JSON.stringify(value))
        } catch {
            // Still unable to write; give up silently.
        }
    }
}

async function removePart(key: string) {
    const scopedKey = await getScopedStorageKey(key)
    await AsyncStorage.removeItem(scopedKey).catch(() => undefined)
}

async function readLegacy(): Promise<LegacyStoredData | null> {
    const scopedLegacy = await readPart<LegacyStoredData>(LEGACY_STORAGE_KEY)
    if (scopedLegacy) return scopedLegacy

    const raw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null

    try {
        return JSON.parse(raw) as LegacyStoredData
    } catch {
        await AsyncStorage.removeItem(LEGACY_STORAGE_KEY)
        return null
    }
}

async function loadState(): Promise<{
    data: AppData
    hasPersistedValue: boolean
}> {
    const scopeKey = await resolveScopeKey()

    if (cacheScopeKey !== scopeKey) {
        cache = null
        cacheScopeKey = scopeKey
        hasPersistedValue = false
    }

    if (cache) {
        return { data: cache, hasPersistedValue }
    }

    const [workoutsPart, machinesPart, historySummaryPart] = await Promise.all([
        readPart<WorkoutsPart>(WORKOUTS_KEY),
        readPart<MachinesPart>(MACHINES_KEY),
        readPart<HistorySummaryPart>(HISTORY_SUMMARY_KEY),
    ])

    if (workoutsPart || machinesPart || historySummaryPart) {
        const data = createEmptyAppData()
        data.workouts = workoutsPart?.workouts ?? {}
        data.workoutOrder = workoutsPart?.workoutOrder ?? []
        data.machines = machinesPart?.machines ?? {}
        data.historySummary = historySummaryPart?.historySummary ?? {
            workoutDates: [],
            byMachine: {},
        }

        await removePart(LEGACY_STORAGE_KEY)
        await AsyncStorage.removeItem(LEGACY_STORAGE_KEY)

        cache = data
        hasPersistedValue = true
        return { data: cache, hasPersistedValue }
    }

    const legacy = await readLegacy()
    if (legacy) {
        // Return the legacy payload verbatim so the workoutData normalizer can
        // migrate the legacy `history` field into `historySummary`.
        cache = legacy as unknown as AppData
        hasPersistedValue = true
        return { data: cache, hasPersistedValue }
    }

    cache = createEmptyAppData()
    hasPersistedValue = false
    return { data: cache, hasPersistedValue }
}

async function ensureCache(): Promise<AppData> {
    const state = await loadState()
    return state.data
}

export async function getData(): Promise<AppData> {
    const state = await loadState()
    return state.data
}

export async function saveData(data: AppData) {
    const scopeKey = await resolveScopeKey()
    cacheScopeKey = scopeKey
    cache = data
    hasPersistedValue = true

    await writePart(WORKOUTS_KEY, {
        workouts: data.workouts,
        workoutOrder: data.workoutOrder,
    })
    await writePart(MACHINES_KEY, { machines: data.machines })
    await writePart(HISTORY_SUMMARY_KEY, {
        historySummary: data.historySummary,
    })

    await removePart(LEGACY_STORAGE_KEY)
    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY)
}

export async function saveWorkouts(
    workouts: Record<string, WorkoutPlan>,
    workoutOrder: number[],
) {
    const data = await ensureCache()
    data.workouts = workouts
    data.workoutOrder = workoutOrder
    hasPersistedValue = true

    await writePart(WORKOUTS_KEY, { workouts, workoutOrder })
}

export async function saveMachines(machines: Record<string, Machine>) {
    const data = await ensureCache()
    data.machines = machines
    hasPersistedValue = true

    await writePart(MACHINES_KEY, { machines })
}

export async function saveHistorySummary(historySummary: HistorySummary) {
    const data = await ensureCache()
    data.historySummary = historySummary
    hasPersistedValue = true

    await writePart(HISTORY_SUMMARY_KEY, { historySummary })
}

export async function clearData() {
    const scopeKey = await resolveScopeKey()
    cacheScopeKey = scopeKey
    cache = createEmptyAppData()
    hasPersistedValue = false

    await Promise.all([
        removePart(WORKOUTS_KEY),
        removePart(MACHINES_KEY),
        removePart(HISTORY_SUMMARY_KEY),
        removePart(LEGACY_STORAGE_KEY),
        AsyncStorage.removeItem(LEGACY_STORAGE_KEY),
    ])
}
