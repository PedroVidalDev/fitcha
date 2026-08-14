import AsyncStorage from '@react-native-async-storage/async-storage'
import { PageResponse } from '../dtos/Page'
import { HistoryApiEntry } from './history'
import { getScopedStorageKey } from './storage'

const MACHINE_HISTORY_CACHE_KEY = 'fitcha_machine_history_pages_v1'

type MachineHistoryCache = Record<
    string,
    Record<string, PageResponse<HistoryApiEntry>>
>

let memoryCache: MachineHistoryCache | null = null
let memoryCacheKey: string | null = null

function pageKey(page: number, limit: number) {
    return `${page}:${limit}`
}

async function resolveCacheKey() {
    return getScopedStorageKey(MACHINE_HISTORY_CACHE_KEY)
}

async function readCache() {
    const key = await resolveCacheKey()
    if (memoryCache && memoryCacheKey === key) return memoryCache

    try {
        const rawCache = await AsyncStorage.getItem(key)
        memoryCache = rawCache
            ? (JSON.parse(rawCache) as MachineHistoryCache)
            : {}
    } catch {
        memoryCache = {}
    }

    memoryCacheKey = key
    return memoryCache
}

export async function getCachedMachineHistoryPage(
    machineId: string,
    page: number,
    limit: number,
) {
    const cache = await readCache()
    return cache[machineId]?.[pageKey(page, limit)] ?? null
}

export async function cacheMachineHistoryPage(
    machineId: string,
    response: PageResponse<HistoryApiEntry>,
) {
    const key = await resolveCacheKey()
    const cache = await readCache()
    const nextCache: MachineHistoryCache = {
        ...cache,
        [machineId]: {
            ...(cache[machineId] ?? {}),
            [pageKey(response.page, response.limit)]: response,
        },
    }

    memoryCache = nextCache
    memoryCacheKey = key
    try {
        await AsyncStorage.setItem(key, JSON.stringify(nextCache))
    } catch {
        // A valid API response remains usable even if persistence fails.
    }
}

export async function clearCachedMachineHistory(machineId?: string) {
    const key = await resolveCacheKey()
    const cache = await readCache()

    if (!machineId) {
        memoryCache = {}
        memoryCacheKey = key
        await AsyncStorage.removeItem(key)
        return
    }

    if (!cache[machineId]) return
    const nextCache = { ...cache }
    delete nextCache[machineId]
    memoryCache = nextCache
    memoryCacheKey = key
    try {
        await AsyncStorage.setItem(key, JSON.stringify(nextCache))
    } catch {
        // Cache cleanup must not block the completed API operation.
    }
}
