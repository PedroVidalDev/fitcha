import { AppData } from '../dtos/AppData'
import { HistoryEntry, HistorySet } from '../dtos/HistoryEntry'
import { HistorySummary, MachineHistorySummary } from '../dtos/HistorySummary'
import { Machine, MachineTrackingType } from '../dtos/Machine'
import { WorkoutPlan } from '../dtos/WorkoutPlan'
import { getRecordHistoryEntry } from '../utils/workoutRecords'
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
    history?: Record<string, HistoryEntry[]>
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

const MAX_WORKOUT_DATES = 365

function emptyMachineHistorySummary(): MachineHistorySummary {
    return {
        latest: null,
        previous: null,
        first: null,
        record: null,
        sessionCount: 0,
        recent: [],
    }
}

function toLocalDayKey(isoDate: string): string {
    const date = new Date(isoDate)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function sortWorkoutDates(dates: Iterable<string>): string[] {
    return [...dates].sort().slice(-MAX_WORKOUT_DATES)
}

function computeHistorySummary(
    groupedEntries: Record<string, HistoryEntry[]>,
    machines: Record<string, Machine>,
): HistorySummary {
    const workoutDates = new Set<string>()
    const byMachine: Record<string, MachineHistorySummary> = {}

    Object.entries(groupedEntries).forEach(([machineId, rawEntries]) => {
        const entries = [...rawEntries].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        )
        const machine = machines[machineId]

        entries.forEach((entry) => workoutDates.add(toLocalDayKey(entry.date)))

        byMachine[machineId] = {
            latest: entries[entries.length - 1] ?? null,
            previous: entries[entries.length - 2] ?? null,
            first: entries[0] ?? null,
            record: getRecordHistoryEntry(entries, machine),
            sessionCount: entries.length,
            recent: entries.slice(-4),
        }
    })

    return {
        workoutDates: sortWorkoutDates(workoutDates),
        byMachine,
    }
}

function buildAppData(
    machines: Machine[],
    workouts: WorkoutPlan[],
    historyEntries: HistoryApiEntry[],
): AppData {
    const data = createEmptyAppData()
    const machineMap: Record<string, Machine> = {}

    machines.forEach((machine) => {
        const normalized = normalizeMachine(machine) ?? machine
        data.machines[machine.id] = normalized
        machineMap[machine.id] = normalized
    })

    workouts.forEach((workout) => {
        data.workouts[String(workout.id)] = workout
        data.workoutOrder.push(workout.id)
    })

    const groupedEntries: Record<string, HistoryEntry[]> = {}
    historyEntries.forEach((entry) => {
        if (!groupedEntries[entry.machineId]) {
            groupedEntries[entry.machineId] = []
        }

        groupedEntries[entry.machineId].push(toHistoryEntry(entry))
    })

    data.historySummary = computeHistorySummary(groupedEntries, machineMap)

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

function normalizeMachineHistorySummary(value: unknown): {
    summary: MachineHistorySummary
    changed: boolean
} {
    if (!value || typeof value !== 'object') {
        return { summary: emptyMachineHistorySummary(), changed: true }
    }

    const candidate = value as Partial<MachineHistorySummary> & {
        recent?: unknown
    }

    let changed = false

    const normalizeField = (
        field: unknown,
    ): { entry: HistoryEntry | null; changed: boolean } => {
        if (field == null) {
            return { entry: null, changed: false }
        }

        const normalized = normalizeHistoryEntry(field)
        if (!normalized.entry) {
            return { entry: null, changed: true }
        }

        return { entry: normalized.entry, changed: normalized.changed }
    }

    const latest = normalizeField(candidate.latest)
    const previous = normalizeField(candidate.previous)
    const first = normalizeField(candidate.first)
    const record = normalizeField(candidate.record)

    const sessionCount =
        typeof candidate.sessionCount === 'number' &&
        Number.isFinite(candidate.sessionCount) &&
        candidate.sessionCount >= 0
            ? Math.trunc(candidate.sessionCount)
            : 0

    const rawRecent = Array.isArray(candidate.recent) ? candidate.recent : []
    const recent: HistoryEntry[] = []

    rawRecent.forEach((entry) => {
        const normalized = normalizeHistoryEntry(entry)
        if (!normalized.entry) {
            changed = true
            return
        }

        if (normalized.changed) {
            changed = true
        }

        recent.push(normalized.entry)
    })

    if (
        latest.changed ||
        previous.changed ||
        first.changed ||
        record.changed ||
        (typeof candidate.sessionCount === 'number'
            ? candidate.sessionCount !== sessionCount
            : true) ||
        !Array.isArray(candidate.recent) ||
        recent.length !== rawRecent.length
    ) {
        changed = true
    }

    return {
        summary: {
            latest: latest.entry,
            previous: previous.entry,
            first: first.entry,
            record: record.entry,
            sessionCount,
            recent,
        },
        changed,
    }
}

function normalizeHistorySummary(value: unknown): {
    summary: HistorySummary
    changed: boolean
} {
    if (!value || typeof value !== 'object') {
        return {
            summary: { workoutDates: [], byMachine: {} },
            changed: true,
        }
    }

    const candidate = value as Partial<HistorySummary>
    let changed = false

    const rawDates = Array.isArray(candidate.workoutDates)
        ? candidate.workoutDates
        : []
    const workoutDates = rawDates.filter(
        (date): date is string => typeof date === 'string',
    )

    if (
        !Array.isArray(candidate.workoutDates) ||
        workoutDates.length !== rawDates.length
    ) {
        changed = true
    }

    const byMachine: Record<string, MachineHistorySummary> = {}
    const rawByMachine =
        candidate.byMachine && typeof candidate.byMachine === 'object'
            ? candidate.byMachine
            : {}

    if (!candidate.byMachine || typeof candidate.byMachine !== 'object') {
        changed = true
    }

    Object.entries(rawByMachine).forEach(([machineId, summary]) => {
        const normalized = normalizeMachineHistorySummary(summary)
        if (normalized.changed) {
            changed = true
        }

        byMachine[machineId] = normalized.summary
    })

    return {
        summary: { workoutDates, byMachine },
        changed,
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

    if (rawData?.historySummary) {
        const normalized = normalizeHistorySummary(rawData.historySummary)
        nextData.historySummary = normalized.summary
        if (normalized.changed) {
            changed = true
        }
    }

    if (rawData?.history) {
        const legacyGrouped: Record<string, HistoryEntry[]> = {}

        Object.entries(rawData.history).forEach(([machineId, entries]) => {
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

            legacyGrouped[machineId] = normalizedEntries
        })

        nextData.historySummary = computeHistorySummary(
            legacyGrouped,
            nextData.machines,
        )
        changed = true
    }

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
            nextData.historySummary = cachedData.historySummary
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
    data.historySummary.byMachine[response.machine.id] =
        data.historySummary.byMachine[response.machine.id] ??
        emptyMachineHistorySummary()

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
        delete data.historySummary.byMachine[machineId]
    }

    await saveData(data)
    isWorkoutDataStale = true
}

export async function saveWorkoutResults(results: WorkoutHistoryInput[]) {
    const createdEntries = await createWorkoutHistory(results)
    const data = await getNormalizedData()

    createdEntries.forEach((entry) => {
        const machineId = entry.machineId
        const existing =
            data.historySummary.byMachine[machineId] ??
            emptyMachineHistorySummary()
        const newEntry = toHistoryEntry(entry)
        const machineConfig = data.machines[machineId]

        const record = getRecordHistoryEntry(
            [existing.record, newEntry].filter(
                (item): item is HistoryEntry => item !== null,
            ),
            machineConfig,
        )

        data.historySummary.byMachine[machineId] = {
            latest: newEntry,
            previous: existing.latest,
            first: existing.first ?? newEntry,
            record,
            sessionCount: existing.sessionCount + 1,
            recent: [...existing.recent, newEntry].slice(-4),
        }

        const workoutDates = new Set(data.historySummary.workoutDates)
        workoutDates.add(toLocalDayKey(newEntry.date))
        data.historySummary.workoutDates = sortWorkoutDates(workoutDates)
    })

    await saveData(data)
    isWorkoutDataStale = true

    return createdEntries.map(toHistoryEntry)
}
