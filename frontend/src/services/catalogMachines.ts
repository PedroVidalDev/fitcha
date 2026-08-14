import AsyncStorage from '@react-native-async-storage/async-storage'
import { isAxiosError } from 'axios'
import { CatalogMachine } from '../dtos/CatalogMachine'
import { PageResponse } from '../dtos/Page'
import { translateRuntime } from '../translates/runtime'
import { axiosApp, ensureApiUrlConfigured } from './axios'

const CATALOG_CACHE_KEY = 'fitcha_catalog_machines_v1'
const CATALOG_CACHE_TTL_MS = 24 * 60 * 60 * 1000

type CatalogCache = {
    updatedAt: number
    machines: CatalogMachine[]
}

let memoryCache: CatalogCache | null = null
let cacheReadPromise: Promise<CatalogCache | null> | null = null
let refreshPromise: Promise<CatalogMachine[]> | null = null

export type CatalogMachineSearchParams = {
    q?: string
    categoryKey?: string
    substitutionGroup?: string
    trackingType?: CatalogMachine['trackingType']
    requiresWeight?: boolean
    excludeIds?: string
    page?: number
    limit?: number
}

function isCatalogMachineList(value: unknown): value is CatalogMachine[] {
    return (
        Array.isArray(value) &&
        value.every(
            (machine) =>
                machine &&
                typeof machine === 'object' &&
                typeof machine.id === 'string' &&
                typeof machine.slug === 'string' &&
                typeof machine.name === 'string' &&
                typeof machine.categoryKey === 'string' &&
                (machine.trackingType === 'sets' ||
                    machine.trackingType === 'duration') &&
                typeof machine.requiresWeight === 'boolean' &&
                Array.isArray(machine.aliases),
        )
    )
}

function isCatalogCache(value: unknown): value is CatalogCache {
    if (!value || typeof value !== 'object') return false

    const candidate = value as Partial<CatalogCache>
    return (
        typeof candidate.updatedAt === 'number' &&
        Number.isFinite(candidate.updatedAt) &&
        isCatalogMachineList(candidate.machines)
    )
}

async function readCatalogCache() {
    if (memoryCache) return memoryCache
    if (cacheReadPromise) return cacheReadPromise

    cacheReadPromise = (async () => {
        try {
            const rawCache = await AsyncStorage.getItem(CATALOG_CACHE_KEY)
            if (!rawCache) return null

            const parsedCache: unknown = JSON.parse(rawCache)
            if (!isCatalogCache(parsedCache)) return null

            memoryCache = parsedCache
            return parsedCache
        } catch {
            return null
        }
    })()

    try {
        return await cacheReadPromise
    } finally {
        cacheReadPromise = null
    }
}

async function saveCatalogCache(machines: CatalogMachine[]) {
    const cache: CatalogCache = {
        updatedAt: Date.now(),
        machines,
    }

    memoryCache = cache

    try {
        await AsyncStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(cache))
    } catch {
        // A storage failure must not discard a valid API response.
    }
}

function isCacheFresh(cache: CatalogCache) {
    return Date.now() - cache.updatedAt < CATALOG_CACHE_TTL_MS
}

function getCatalogMachineErrorMessage(error: unknown, fallback: string) {
    if (isAxiosError(error)) {
        const responseData = error.response?.data

        if (
            responseData &&
            typeof responseData === 'object' &&
            'error' in responseData &&
            typeof responseData.error === 'string' &&
            responseData.error.trim()
        ) {
            return responseData.error
        }
    }

    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return fallback
}

export async function getCachedCatalogMachines() {
    const cache = await readCatalogCache()
    return cache?.machines ?? []
}

async function fetchCatalogMachines() {
    ensureApiUrlConfigured()

    const response = await axiosApp.get<CatalogMachine[]>('/machines/catalog')
    await saveCatalogCache(response.data)
    return response.data
}

export async function getCatalogMachines(options?: { forceRefresh?: boolean }) {
    const cache = await readCatalogCache()

    if (!options?.forceRefresh && cache && isCacheFresh(cache)) {
        return cache.machines
    }

    if (!refreshPromise) {
        refreshPromise = fetchCatalogMachines().finally(() => {
            refreshPromise = null
        })
    }

    try {
        return await refreshPromise
    } catch (error) {
        if (cache) return cache.machines

        throw new Error(
            getCatalogMachineErrorMessage(
                error,
                translateRuntime('services.machines.loadError'),
            ),
        )
    }
}

export async function searchCatalogMachines(
    params: CatalogMachineSearchParams,
) {
    ensureApiUrlConfigured()

    try {
        const response = await axiosApp.get<PageResponse<CatalogMachine>>(
            '/machines/catalog/search',
            { params },
        )
        return response.data
    } catch (error) {
        throw new Error(
            getCatalogMachineErrorMessage(
                error,
                translateRuntime('services.machines.loadError'),
            ),
        )
    }
}
