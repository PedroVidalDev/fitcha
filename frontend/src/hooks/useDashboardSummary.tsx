import { useCallback, useEffect, useState } from 'react'
import { MachineCategoryKey } from '../constants/categories'
import { useI18n } from '../contexts/I18nContext'
import { AppData } from '../dtos/AppData'
import { HistorySet } from '../dtos/HistoryEntry'
import { MachineTrackingType } from '../dtos/Machine'
import { getCachedWorkoutData, loadWorkoutData } from '../services/workoutData'
import { TranslationKey } from '../translates'
import {
    getHistoryEntryPrimaryMetric,
    getHistoryEntryVolume,
    getHistoryMetricKind,
    getRecordHistoryEntry,
} from '../utils/workoutRecords'

type WorkoutDayAggregate = {
    key: string
    date: Date
}

type Translator = (
    key: TranslationKey,
    params?: Record<string, number | string>,
) => string

export type DashboardPlanDay = {
    dayIndex: number
    label: string
    shortLabel: string
    machineCount: number
    categoryKeys: MachineCategoryKey[]
    isToday: boolean
}

export type DashboardMachineProgressPoint = {
    key: string
    label: string
    value: number
}

export type DashboardMachineProgress = {
    machineId: string
    name: string
    categoryKey: MachineCategoryKey
    trackingType: MachineTrackingType
    requiresWeight: boolean
    sessionCount: number
    metricKind: 'weight' | 'reps' | 'duration'
    latestMetric: number | null
    previousMetric: number | null
    firstMetric: number | null
    bestMetric: number | null
    bestRecordSets: HistorySet[] | null
    bestVolume: number | null
    deltaFromStart: number | null
    deltaFromPrevious: number | null
    lastTrainedLabel: string | null
    points: DashboardMachineProgressPoint[]
}

export type DashboardSummary = {
    streak: number
    recentWorkoutDays: number
    monthlyWorkoutDays: number
    scheduledDayCount: number
    totalMachinesScheduled: number
    nextPlannedDayLabel: string | null
    lastWorkoutLabel: string | null
    weekPlan: DashboardPlanDay[]
    featuredPlanDay: DashboardPlanDay | null
    machineProgress: DashboardMachineProgress[]
    hasHistory: boolean
}

const EMPTY_SUMMARY: DashboardSummary = {
    streak: 0,
    recentWorkoutDays: 0,
    monthlyWorkoutDays: 0,
    scheduledDayCount: 0,
    totalMachinesScheduled: 0,
    nextPlannedDayLabel: null,
    lastWorkoutLabel: null,
    weekPlan: [],
    featuredPlanDay: null,
    machineProgress: [],
    hasHistory: false,
}

function startOfLocalDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, amount: number) {
    const next = new Date(date)
    next.setDate(next.getDate() + amount)
    return next
}

function getDayKey(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function diffInDays(from: Date, to: Date) {
    const diffMs =
        startOfLocalDay(from).getTime() - startOfLocalDay(to).getTime()
    return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

function formatRelativeDay(
    date: Date,
    now: Date,
    locale: string,
    t: Translator,
) {
    const diff = diffInDays(now, date)

    if (diff === 0) return t('common.relative.today')
    if (diff === 1) return t('common.relative.yesterday')
    if (diff < 7) return t('home.relative.daysAgo', { count: diff })

    return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })
}

function buildWorkoutDays(data: AppData) {
    const workoutDays = new Map<string, WorkoutDayAggregate>()

    Object.values(data.history).forEach((entries) => {
        entries.forEach((entry) => {
            const entryDate = startOfLocalDay(new Date(entry.date))
            const key = getDayKey(entryDate)

            if (!workoutDays.has(key)) {
                workoutDays.set(key, {
                    key,
                    date: entryDate,
                })
            }
        })
    })

    return [...workoutDays.values()].sort(
        (a, b) => a.date.getTime() - b.date.getTime(),
    )
}

function buildShortWorkoutLabel(title: string, index: number) {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
        return `${index + 1}`
    }

    const words = trimmedTitle.split(/\s+/).filter(Boolean)
    if (words.length >= 2) {
        return words
            .slice(0, 2)
            .map((word) => word[0]?.toUpperCase() ?? '')
            .join('')
    }

    return trimmedTitle.slice(0, 3).toUpperCase()
}

function buildWeekPlan(data: AppData) {
    return data.workoutOrder
        .map((workoutId, index) => {
            const workout = data.workouts[String(workoutId)]
            if (!workout) return null

            const categoryKeys = [
                ...new Set(
                    workout.machineIds
                        .map(
                            (machineId) =>
                                data.machines[machineId]?.categoryKey,
                        )
                        .filter(Boolean) as MachineCategoryKey[],
                ),
            ]

            return {
                dayIndex: workout.id,
                label: workout.title,
                shortLabel: buildShortWorkoutLabel(workout.title, index),
                machineCount: workout.machineIds.length,
                categoryKeys,
                isToday: index === 0,
            }
        })
        .filter(Boolean) as DashboardPlanDay[]
}

function buildNextPlannedDayLabel(weekPlan: DashboardPlanDay[], t: Translator) {
    const nextWorkout =
        weekPlan.find((item) => item.machineCount > 0) ?? weekPlan[0]

    if (!nextWorkout) {
        return null
    }

    return t('home.nextPlanned.other', {
        day: nextWorkout.label,
        count: nextWorkout.machineCount,
        pluralSuffix: nextWorkout.machineCount !== 1 ? 's' : '',
    })
}

function buildFeaturedPlanDay(weekPlan: DashboardPlanDay[]) {
    return weekPlan.find((item) => item.machineCount > 0) ?? null
}

function buildStreak(workoutDays: WorkoutDayAggregate[], now: Date) {
    if (workoutDays.length === 0) return 0

    const dates = workoutDays.map((item) => item.date)
    const latestDate = dates[dates.length - 1]
    const today = startOfLocalDay(now)
    const yesterday = addDays(today, -1)

    if (
        latestDate.getTime() !== today.getTime() &&
        latestDate.getTime() !== yesterday.getTime()
    ) {
        return 0
    }

    let streak = 1
    let cursor = latestDate

    for (let index = dates.length - 2; index >= 0; index -= 1) {
        const expectedPrevious = addDays(cursor, -1)

        if (dates[index].getTime() !== expectedPrevious.getTime()) {
            break
        }

        streak += 1
        cursor = dates[index]
    }

    return streak
}

function buildMachineProgress(
    data: AppData,
    machineId: string,
    now: Date,
    locale: string,
    t: Translator,
): DashboardMachineProgress | null {
    const machine = data.machines[machineId]

    if (!machine) return null

    const sortedHistory = [...(data.history[machineId] ?? [])].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    const latestEntry = sortedHistory[sortedHistory.length - 1]
    const previousEntry = sortedHistory[sortedHistory.length - 2]
    const firstEntry = sortedHistory[0]
    const recordEntry = getRecordHistoryEntry(sortedHistory, machine)
    const metricKind = getHistoryMetricKind(machine)
    const latestMetric = latestEntry
        ? getHistoryEntryPrimaryMetric(latestEntry, machine)
        : null
    const previousMetric = previousEntry
        ? getHistoryEntryPrimaryMetric(previousEntry, machine)
        : null
    const firstMetric = firstEntry
        ? getHistoryEntryPrimaryMetric(firstEntry, machine)
        : null
    const bestMetric = recordEntry
        ? getHistoryEntryPrimaryMetric(recordEntry, machine)
        : null

    return {
        machineId: machine.id,
        name: machine.name,
        categoryKey: machine.categoryKey,
        trackingType: machine.trackingType,
        requiresWeight: machine.requiresWeight,
        sessionCount: sortedHistory.length,
        metricKind,
        latestMetric,
        previousMetric,
        firstMetric,
        bestMetric,
        bestRecordSets: recordEntry?.sets ?? null,
        bestVolume:
            metricKind === 'weight' && recordEntry
                ? getHistoryEntryVolume(recordEntry)
                : null,
        deltaFromStart:
            latestMetric !== null &&
            firstMetric !== null &&
            sortedHistory.length > 1
                ? latestMetric - firstMetric
                : null,
        deltaFromPrevious:
            latestMetric !== null && previousMetric !== null
                ? latestMetric - previousMetric
                : null,
        lastTrainedLabel: latestEntry
            ? formatRelativeDay(new Date(latestEntry.date), now, locale, t)
            : null,
        points: sortedHistory.slice(-4).map((entry) => ({
            key: entry.id,
            label: formatRelativeDay(new Date(entry.date), now, locale, t),
            value: getHistoryEntryPrimaryMetric(entry, machine),
        })),
    }
}

function buildSummary(
    data: AppData,
    locale: string,
    t: Translator,
): DashboardSummary {
    const now = new Date()
    const today = startOfLocalDay(now)
    const workoutDays = buildWorkoutDays(data)
    const weekPlan = buildWeekPlan(data)
    const featuredPlanDay = buildFeaturedPlanDay(weekPlan)
    const recentWorkoutDays = workoutDays.filter((item) => {
        const diff = diffInDays(today, item.date)
        return diff >= 0 && diff < 7
    }).length
    const monthlyWorkoutDays = workoutDays.filter((item) => {
        const diff = diffInDays(today, item.date)
        return diff >= 0 && diff < 30
    }).length
    const scheduledDayCount = weekPlan.length
    const totalMachinesScheduled = weekPlan.reduce(
        (sum, item) => sum + item.machineCount,
        0,
    )
    const lastWorkout = workoutDays[workoutDays.length - 1]
    const featuredWorkout = featuredPlanDay
        ? (data.workouts[String(featuredPlanDay.dayIndex)] ?? null)
        : null
    const machineProgress = featuredWorkout
        ? featuredWorkout.machineIds
              .map((machineId) =>
                  buildMachineProgress(data, machineId, now, locale, t),
              )
              .filter(Boolean)
        : []

    return {
        streak: buildStreak(workoutDays, now),
        recentWorkoutDays,
        monthlyWorkoutDays,
        scheduledDayCount,
        totalMachinesScheduled,
        nextPlannedDayLabel: buildNextPlannedDayLabel(weekPlan, t),
        lastWorkoutLabel: lastWorkout
            ? formatRelativeDay(lastWorkout.date, now, locale, t)
            : null,
        weekPlan,
        featuredPlanDay,
        machineProgress: machineProgress as DashboardMachineProgress[],
        hasHistory: workoutDays.length > 0,
    }
}

export function useDashboardSummary() {
    const { locale, t } = useI18n()
    const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY)
    const [isLoading, setIsLoading] = useState(true)

    const refresh = useCallback(async () => {
        const cachedData = await getCachedWorkoutData()
        setSummary(buildSummary(cachedData, locale, t))

        const data = await loadWorkoutData()
        setSummary(buildSummary(data, locale, t))
        setIsLoading(false)
    }, [locale, t])

    useEffect(() => {
        refresh()
    }, [refresh])

    return { summary, isLoading, refresh }
}
