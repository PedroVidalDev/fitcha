import { AppData } from '../dtos/AppData'
import { HistoryEntry, HistorySet } from '../dtos/HistoryEntry'
import { Machine, MachineTrackingType } from '../dtos/Machine'
import { WorkoutPlan } from '../dtos/WorkoutPlan'
import {
    createWorkoutHistory,
    getMyHistory,
    HistoryApiEntry,
    WorkoutHistoryInput,
} from './history'
import { getMyMachines } from './machines'
import { clearScheduledNotifications } from './notifications'
import { cacheMachines } from './machineCache'
import { createEmptyAppData, getData, saveData } from './storage'
import {
    addMachineToWorkout as addMachineToWorkoutRequest,
    createWorkout as createWorkoutRequest,
    deleteWorkout as deleteWorkoutRequest,
    getMyWorkouts,
    removeMachineFromWorkout as removeMachineFromWorkoutRequest,
    updateWorkout as updateWorkoutRequest,
    WorkoutMachineInput,
} from './workouts'

let syncPromise: Promise<AppData> | null = null
let isWorkoutDataStale = true
let workoutDataRevision = 0

type LegacyAppData = Partial<AppData> & {
    days?: Record<number, string[]>
}

export function resetWorkoutSyncState() {
    syncPromise = null
    isWorkoutDataStale = true
    workoutDataRevision += 1
}

export function markWorkoutDataStale() {
    isWorkoutDataStale = true
    workoutDataRevision += 1
}

function buildAppData(
    machines: Machine[],
    workouts: WorkoutPlan[],
    historyEntries: HistoryApiEntry[],
): AppData {
    const data = createEmptyAppData()

    machines.forEach((machine) => {
        data.machines[machine.id] = normalizeMachine(machine) ?? machine
    })

    workouts.forEach((workout) => {
        data.workouts[String(workout.id)] = workout
        data.workoutOrder.push(workout.id)
    })

    historyEntries.forEach((entry) => {
        if (!data.history[entry.machineId]) {
            data.history[entry.machineId] = []
        }

        data.history[entry.machineId].push(toHistoryEntry(entry))
    })

    return data
}

function toHistoryEntry(entry: HistoryApiEntry): HistoryEntry {
    return {
        id: entry.id,
        sets: entry.sets.map((set) => ({
            weight: set.weight,
            reps: set.reps,
            durationSeconds: set.durationSeconds ?? 0,
        })),
        date: entry.date,
        label: '',
    }
}

function normalizeTrackingType(value: unknown): MachineTrackingType {
    return value === 'duration' ? 'duration' : 'sets'
}

function normalizeMachine(value: unknown): Machine | null {
    if (!value || typeof value !== 'object') {
        return null
    }

    const candidate = value as Partial<Machine>
    if (
        typeof candidate.id !== 'string' ||
        typeof candidate.name !== 'string' ||
        typeof candidate.categoryKey !== 'string'
    ) {
        return null
    }

    const trackingType = normalizeTrackingType(candidate.trackingType)
    const requiresWeight =
        trackingType === 'duration'
            ? false
            : typeof candidate.requiresWeight === 'boolean'
              ? candidate.requiresWeight
              : true

    return {
        id: candidate.id,
        catalogMachineId:
            typeof candidate.catalogMachineId === 'string'
                ? candidate.catalogMachineId
                : undefined,
        name: candidate.name,
        description:
            typeof candidate.description === 'string'
                ? candidate.description
                : undefined,
        photo:
            typeof candidate.photo === 'string' ? candidate.photo : undefined,
        categoryKey: candidate.categoryKey,
        substitutionGroup:
            typeof candidate.substitutionGroup === 'string'
                ? candidate.substitutionGroup
                : undefined,
        trackingType,
        requiresWeight,
    }
}

function normalizeHistorySet(value: unknown): HistorySet | null {
    if (typeof value === 'number') {
        if (!Number.isFinite(value) || value <= 0) return null

        return {
            weight: value,
            reps: 0,
            durationSeconds: 0,
        }
    }

    if (!value || typeof value !== 'object') {
        return null
    }

    const rawWeight =
        'weight' in value ? (value as { weight?: unknown }).weight : undefined
    const rawReps =
        'reps' in value ? (value as { reps?: unknown }).reps : undefined
    const rawDurationSeconds =
        'durationSeconds' in value
            ? (value as { durationSeconds?: unknown }).durationSeconds
            : undefined
    const weight =
        typeof rawWeight === 'number'
            ? rawWeight
            : typeof rawWeight === 'string'
              ? Number(rawWeight)
              : 0
    const reps =
        typeof rawReps === 'number'
            ? rawReps
            : typeof rawReps === 'string'
              ? Number(rawReps)
              : 0
    const durationSeconds =
        typeof rawDurationSeconds === 'number'
            ? rawDurationSeconds
            : typeof rawDurationSeconds === 'string'
              ? Number(rawDurationSeconds)
              : 0

    const normalizedWeight = Number.isFinite(weight) && weight > 0 ? weight : 0
    const normalizedReps =
        Number.isFinite(reps) && reps > 0 ? Math.trunc(reps) : 0
    const normalizedDuration =
        Number.isFinite(durationSeconds) && durationSeconds > 0
            ? Math.trunc(durationSeconds)
            : 0

    if (
        normalizedWeight <= 0 &&
        normalizedReps <= 0 &&
        normalizedDuration <= 0
    ) {
        return null
    }

    return {
        weight: normalizedWeight,
        reps: normalizedReps,
        durationSeconds: normalizedDuration,
    }
}

function normalizeHistoryEntry(entry: unknown): {
    entry: HistoryEntry | null
    changed: boolean
} {
    if (!entry || typeof entry !== 'object') {
        return { entry: null, changed: false }
    }

    const candidate = entry as Partial<HistoryEntry> & {
        sets?: unknown
        label?: unknown
    }

    if (
        typeof candidate.id !== 'string' ||
        typeof candidate.date !== 'string'
    ) {
        return { entry: null, changed: false }
    }

    const rawSets = Array.isArray(candidate.sets) ? candidate.sets : []
    const sets = rawSets
        .map(normalizeHistorySet)
        .filter((set): set is HistorySet => set !== null)
    const normalizedEntry: HistoryEntry = {
        id: candidate.id,
        sets,
        date: candidate.date,
        label: typeof candidate.label === 'string' ? candidate.label : '',
    }

    const changed =
        !Array.isArray(candidate.sets) ||
        rawSets.length !== sets.length ||
        rawSets.some((set, index) => {
            if (typeof set === 'number') {
                return true
            }

            if (!set || typeof set !== 'object') {
                return true
            }

            const current = sets[index]
            if (!current) {
                return true
            }

            return (
                (set as { weight?: unknown }).weight !== current.weight ||
                (set as { reps?: unknown }).reps !== current.reps ||
                (set as { durationSeconds?: unknown }).durationSeconds !==
                    current.durationSeconds
            )
        }) ||
        typeof candidate.label !== 'string'

    return { entry: normalizedEntry, changed }
}

function normalizeWorkoutPlan(value: unknown): WorkoutPlan | null {
    if (!value || typeof value !== 'object') {
        return null
    }

    const candidate = value as Partial<WorkoutPlan> & {
        machineIds?: unknown
    }

    if (
        typeof candidate.id !== 'number' ||
        !Number.isFinite(candidate.id) ||
        candidate.id <= 0 ||
        typeof candidate.title !== 'string'
    ) {
        return null
    }

    const machineIds = Array.isArray(candidate.machineIds)
        ? candidate.machineIds.filter(
              (item): item is string => typeof item === 'string',
          )
        : []

    return {
        id: candidate.id,
        title: candidate.title,
        description:
            typeof candidate.description === 'string'
                ? candidate.description
                : undefined,
        machineIds,
    }
}

function normalizeAppData(rawData: LegacyAppData): {
    data: AppData
    changed: boolean
} {
    let changed = false
    const nextData = createEmptyAppData()

    if (
        rawData &&
        typeof rawData === 'object' &&
        rawData.machines &&
        typeof rawData.machines === 'object'
    ) {
        Object.entries(rawData.machines).forEach(([machineId, machine]) => {
            const normalizedMachine = normalizeMachine(machine)
            if (!normalizedMachine) {
                changed = true
                return
            }

            nextData.machines[machineId] = normalizedMachine

            if (
                !machine ||
                typeof machine !== 'object' ||
                normalizeTrackingType(
                    (machine as Partial<Machine>).trackingType,
                ) !== normalizedMachine.trackingType ||
                (typeof (machine as Partial<Machine>).requiresWeight ===
                'boolean'
                    ? (machine as Partial<Machine>).requiresWeight
                    : normalizedMachine.trackingType === 'duration'
                      ? false
                      : true) !== normalizedMachine.requiresWeight
            ) {
                changed = true
            }
        })
    }

    if (
        rawData &&
        typeof rawData === 'object' &&
        rawData.workouts &&
        typeof rawData.workouts === 'object'
    ) {
        const normalizedWorkouts = Object.values(rawData.workouts)
            .map(normalizeWorkoutPlan)
            .filter((workout): workout is WorkoutPlan => workout !== null)

        normalizedWorkouts.forEach((workout) => {
            nextData.workouts[String(workout.id)] = workout
        })

        if (Array.isArray(rawData.workoutOrder)) {
            nextData.workoutOrder = rawData.workoutOrder.filter(
                (id): id is number =>
                    typeof id === 'number' &&
                    Boolean(nextData.workouts[String(id)]),
            )
        }

        if (nextData.workoutOrder.length !== normalizedWorkouts.length) {
            nextData.workoutOrder = normalizedWorkouts.map(
                (workout) => workout.id,
            )
            changed = true
        }
    } else if (rawData.days) {
        changed = true
    }

    Object.entries(rawData?.history ?? {}).forEach(([machineId, entries]) => {
        if (!Array.isArray(entries)) {
            changed = true
            return
        }

        const normalizedEntries: HistoryEntry[] = []

        entries.forEach((entry) => {
            const normalized = normalizeHistoryEntry(entry)
            if (!normalized.entry) {
                changed = true
                return
            }

            if (normalized.changed) {
                changed = true
            }

            normalizedEntries.push(normalized.entry)
        })

        nextData.history[machineId] = normalizedEntries
    })

    return { data: nextData, changed }
}

async function getNormalizedData() {
    const data = (await getData()) as LegacyAppData
    const normalized = normalizeAppData(data)

    if (normalized.changed) {
        await saveData(normalized.data)
    }

    return normalized.data
}

function upsertWorkout(data: AppData, workout: WorkoutPlan) {
    data.workouts[String(workout.id)] = workout

    if (!data.workoutOrder.includes(workout.id)) {
        data.workoutOrder.push(workout.id)
    }
}

export async function getCachedWorkoutData() {
    return getNormalizedData()
}

export async function loadWorkoutData(options?: { forceSync?: boolean }) {
    const cachedData = await getNormalizedData()
    const shouldSync = options?.forceSync || isWorkoutDataStale

    if (!shouldSync) {
        return cachedData
    }

    try {
        return await syncWorkoutData()
    } catch {
        return cachedData
    }
}

async function syncWorkoutData() {
    if (syncPromise) {
        return syncPromise
    }

    syncPromise = (async () => {
        const syncRevision = workoutDataRevision
        const cachedData = await getNormalizedData()
        const [machines, workouts, historyEntries] = await Promise.all([
            getMyMachines(),
            getMyWorkouts(),
            getMyHistory().catch(() => null),
        ])

        const nextData = buildAppData(machines, workouts, historyEntries ?? [])
        if (!historyEntries) {
            nextData.history = cachedData.history
        }

        if (syncRevision !== workoutDataRevision) {
            return getNormalizedData()
        }

        await cacheMachines(machines)
        await saveData(nextData)
        isWorkoutDataStale = false

        try {
            await clearScheduledNotifications()
        } catch {
            // Notification cleanup cannot block workout sync.
        }

        return nextData
    })()

    try {
        return await syncPromise
    } finally {
        syncPromise = null
    }
}

export async function createWorkoutPlan(title: string, description?: string) {
    const workout = await createWorkoutRequest({ title, description })
    const data = await getNormalizedData()

    upsertWorkout(data, workout)

    await saveData(data)
    isWorkoutDataStale = true

    try {
        await clearScheduledNotifications()
    } catch {
        // Notification cleanup cannot block local cache updates.
    }

    return workout
}

export async function updateWorkoutPlan(
    workoutId: number,
    title?: string,
    description?: string,
) {
    const workout = await updateWorkoutRequest(workoutId, {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
    })
    const data = await getNormalizedData()

    upsertWorkout(data, workout)

    await saveData(data)
    isWorkoutDataStale = true

    return workout
}

export async function deleteWorkoutPlan(workoutId: number) {
    await deleteWorkoutRequest(workoutId)
    const data = await getNormalizedData()

    delete data.workouts[String(workoutId)]
    data.workoutOrder = data.workoutOrder.filter((id) => id !== workoutId)

    await saveData(data)
    isWorkoutDataStale = true

    return data
}

export async function addMachineToWorkout(
    workoutId: number,
    input: WorkoutMachineInput,
) {
    const response = await addMachineToWorkoutRequest(workoutId, input)
    const data = await getNormalizedData()

    data.machines[response.machine.id] = response.machine
    upsertWorkout(data, response.workout)
    data.history[response.machine.id] = data.history[response.machine.id] ?? []

    await saveData(data)
    isWorkoutDataStale = true

    return response.machine
}

export async function removeMachineFromWorkout(
    workoutId: number,
    machineId: string,
) {
    const response = await removeMachineFromWorkoutRequest(workoutId, machineId)
    const data = await getNormalizedData()

    upsertWorkout(data, response.workout)

    if (response.removedMachine) {
        delete data.machines[machineId]
        delete data.history[machineId]
    }

    await saveData(data)
    isWorkoutDataStale = true
}

export async function saveWorkoutResults(results: WorkoutHistoryInput[]) {
    const createdEntries = await createWorkoutHistory(results)
    const data = await getNormalizedData()

    createdEntries.forEach((entry) => {
        if (!data.history[entry.machineId]) {
            data.history[entry.machineId] = []
        }

        data.history[entry.machineId].unshift(toHistoryEntry(entry))
    })

    await saveData(data)
    isWorkoutDataStale = true

    return createdEntries.map(toHistoryEntry)
}
