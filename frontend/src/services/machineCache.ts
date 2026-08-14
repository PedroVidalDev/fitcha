import AsyncStorage from '@react-native-async-storage/async-storage'
import { Machine } from '../dtos/Machine'
import { getScopedStorageKey } from './storage'

const MACHINE_CACHE_KEY = 'fitcha_machine_entities_v1'

type MachineCache = {
    entities: Record<string, Machine>
}

let memoryCache: MachineCache | null = null
let memoryCacheKey: string | null = null

async function resolveCacheKey() {
    return getScopedStorageKey(MACHINE_CACHE_KEY)
}

async function readCache() {
    const key = await resolveCacheKey()
    if (memoryCache && memoryCacheKey === key) return memoryCache

    try {
        const rawCache = await AsyncStorage.getItem(key)
        const parsed = rawCache ? (JSON.parse(rawCache) as MachineCache) : null
        memoryCache =
            parsed && parsed.entities && typeof parsed.entities === 'object'
                ? parsed
                : { entities: {} }
    } catch {
        memoryCache = { entities: {} }
    }

    memoryCacheKey = key
    return memoryCache
}

async function saveCache(cache: MachineCache) {
    const key = await resolveCacheKey()
    memoryCache = cache
    memoryCacheKey = key
    try {
        await AsyncStorage.setItem(key, JSON.stringify(cache))
    } catch {
        // A valid API response remains usable even if persistence fails.
    }
}

export async function getCachedMachine(machineId: string) {
    const cache = await readCache()
    return cache.entities[machineId] ?? null
}

export async function getCachedMachines() {
    const cache = await readCache()
    return Object.values(cache.entities)
}

export async function cacheMachines(machines: Machine[]) {
    if (machines.length === 0) return

    const cache = await readCache()
    const entities = { ...cache.entities }
    machines.forEach((machine) => {
        entities[machine.id] = machine
    })
    await saveCache({ entities })
}

export async function removeCachedMachine(machineId: string) {
    const cache = await readCache()
    if (!cache.entities[machineId]) return

    const entities = { ...cache.entities }
    delete entities[machineId]
    await saveCache({ entities })
}

export async function clearMachineCache() {
    const key = await resolveCacheKey()
    memoryCache = { entities: {} }
    memoryCacheKey = key
    await AsyncStorage.removeItem(key)
}
