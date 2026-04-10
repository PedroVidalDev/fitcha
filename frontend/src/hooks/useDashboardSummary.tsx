import { useCallback, useEffect, useState } from "react";
import { DAYS_LABEL, DAYS_SHORT, MachineCategoryKey } from "../constants/categories";
import { AppData } from "../dtos/AppData";
import { HistoryEntry } from "../dtos/HistoryEntry";
import { getCachedWorkoutData, loadWorkoutData } from "../services/workoutData";

type WorkoutDayAggregate = {
    key: string;
    date: Date;
};

export type DashboardPlanDay = {
    dayIndex: number;
    label: string;
    shortLabel: string;
    machineCount: number;
    categoryKeys: MachineCategoryKey[];
    isToday: boolean;
};

export type DashboardMachineProgressPoint = {
    key: string;
    label: string;
    maxWeight: number;
};

export type DashboardMachineProgress = {
    machineId: string;
    name: string;
    categoryKey: MachineCategoryKey;
    sessionCount: number;
    latestWeight: number | null;
    previousWeight: number | null;
    firstWeight: number | null;
    bestWeight: number | null;
    deltaFromStart: number | null;
    deltaFromPrevious: number | null;
    lastTrainedLabel: string | null;
    points: DashboardMachineProgressPoint[];
};

export type DashboardSummary = {
    streak: number;
    recentWorkoutDays: number;
    monthlyWorkoutDays: number;
    scheduledDayCount: number;
    totalMachinesScheduled: number;
    nextPlannedDayLabel: string | null;
    lastWorkoutLabel: string | null;
    weekPlan: DashboardPlanDay[];
    featuredPlanDay: DashboardPlanDay | null;
    machineProgress: DashboardMachineProgress[];
    hasHistory: boolean;
};

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
};

function startOfLocalDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
}

function getDayKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function diffInDays(from: Date, to: Date) {
    const diffMs = startOfLocalDay(from).getTime() - startOfLocalDay(to).getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function formatRelativeDay(date: Date, now: Date) {
    const diff = diffInDays(now, date);

    if (diff === 0) return "hoje";
    if (diff === 1) return "ontem";
    if (diff < 7) return `${diff} dias`;

    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function getEntryMaxWeight(entry: HistoryEntry) {
    return Math.max(...entry.sets);
}

function buildWorkoutDays(data: AppData) {
    const workoutDays = new Map<string, WorkoutDayAggregate>();

    Object.values(data.history).forEach((entries) => {
        entries.forEach((entry) => {
            const entryDate = startOfLocalDay(new Date(entry.date));
            const key = getDayKey(entryDate);

            if (!workoutDays.has(key)) {
                workoutDays.set(key, {
                    key,
                    date: entryDate,
                });
            }
        });
    });

    return [...workoutDays.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
}

function buildWeekPlan(data: AppData, todayIndex: number) {
    return Array.from({ length: 7 }, (_, dayIndex) => {
        const machineIds = data.days[dayIndex] ?? [];
        const categoryKeys = [
            ...new Set(
                machineIds
                    .map((machineId) => data.machines[machineId]?.categoryKey)
                    .filter(Boolean) as MachineCategoryKey[],
            ),
        ];

        return {
            dayIndex,
            label: DAYS_LABEL[dayIndex],
            shortLabel: DAYS_SHORT[dayIndex],
            machineCount: machineIds.length,
            categoryKeys,
            isToday: todayIndex === dayIndex,
        };
    });
}

function buildNextPlannedDayLabel(weekPlan: DashboardPlanDay[], todayIndex: number) {
    for (let offset = 0; offset < 7; offset += 1) {
        const dayIndex = (todayIndex + offset) % 7;
        const day = weekPlan[dayIndex];

        if (day.machineCount === 0) continue;

        if (offset === 0) {
            return `Hoje - ${day.machineCount} máquina${day.machineCount > 1 ? "s" : ""}`;
        }

        if (offset === 1) {
            return `Amanhã - ${day.machineCount} máquina${day.machineCount > 1 ? "s" : ""}`;
        }

        return `${day.label} - ${day.machineCount} máquina${day.machineCount > 1 ? "s" : ""}`;
    }

    return null;
}

function buildFeaturedPlanDay(weekPlan: DashboardPlanDay[], todayIndex: number) {
    for (let offset = 0; offset < 7; offset += 1) {
        const dayIndex = (todayIndex + offset) % 7;
        const day = weekPlan[dayIndex];

        if (day.machineCount > 0) return day;
    }

    return null;
}

function buildStreak(workoutDays: WorkoutDayAggregate[], now: Date) {
    if (workoutDays.length === 0) return 0;

    const dates = workoutDays.map((item) => item.date);
    const latestDate = dates[dates.length - 1];
    const today = startOfLocalDay(now);
    const yesterday = addDays(today, -1);

    if (latestDate.getTime() !== today.getTime() && latestDate.getTime() !== yesterday.getTime()) {
        return 0;
    }

    let streak = 1;
    let cursor = latestDate;

    for (let index = dates.length - 2; index >= 0; index -= 1) {
        const expectedPrevious = addDays(cursor, -1);

        if (dates[index].getTime() !== expectedPrevious.getTime()) {
            break;
        }

        streak += 1;
        cursor = dates[index];
    }

    return streak;
}

function buildMachineProgress(
    data: AppData,
    machineId: string,
    now: Date,
): DashboardMachineProgress | null {
    const machine = data.machines[machineId];

    if (!machine) return null;

    const sortedHistory = [...(data.history[machineId] ?? [])].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const latestEntry = sortedHistory[sortedHistory.length - 1];
    const previousEntry = sortedHistory[sortedHistory.length - 2];
    const firstEntry = sortedHistory[0];
    const latestWeight = latestEntry ? getEntryMaxWeight(latestEntry) : null;
    const previousWeight = previousEntry ? getEntryMaxWeight(previousEntry) : null;
    const firstWeight = firstEntry ? getEntryMaxWeight(firstEntry) : null;
    const bestWeight =
        sortedHistory.length > 0
            ? Math.max(...sortedHistory.map((entry) => getEntryMaxWeight(entry)))
            : null;

    return {
        machineId: machine.id,
        name: machine.name,
        categoryKey: machine.categoryKey,
        sessionCount: sortedHistory.length,
        latestWeight,
        previousWeight,
        firstWeight,
        bestWeight,
        deltaFromStart:
            latestWeight !== null && firstWeight !== null && sortedHistory.length > 1
                ? latestWeight - firstWeight
                : null,
        deltaFromPrevious:
            latestWeight !== null && previousWeight !== null ? latestWeight - previousWeight : null,
        lastTrainedLabel: latestEntry ? formatRelativeDay(new Date(latestEntry.date), now) : null,
        points: sortedHistory.slice(-4).map((entry) => ({
            key: entry.id,
            label: formatRelativeDay(new Date(entry.date), now),
            maxWeight: getEntryMaxWeight(entry),
        })),
    };
}

function buildSummary(data: AppData): DashboardSummary {
    const now = new Date();
    const today = startOfLocalDay(now);
    const todayIndex = now.getDay();
    const workoutDays = buildWorkoutDays(data);
    const weekPlan = buildWeekPlan(data, todayIndex);
    const featuredPlanDay = buildFeaturedPlanDay(weekPlan, todayIndex);
    const recentWorkoutDays = workoutDays.filter((item) => {
        const diff = diffInDays(today, item.date);
        return diff >= 0 && diff < 7;
    }).length;
    const monthlyWorkoutDays = workoutDays.filter((item) => {
        const diff = diffInDays(today, item.date);
        return diff >= 0 && diff < 30;
    }).length;
    const scheduledDayCount = weekPlan.filter((item) => item.machineCount > 0).length;
    const totalMachinesScheduled = weekPlan.reduce((sum, item) => sum + item.machineCount, 0);
    const lastWorkout = workoutDays[workoutDays.length - 1];
    const machineProgress = featuredPlanDay
        ? ((data.days[featuredPlanDay.dayIndex] ?? [])
              .map((machineId) => buildMachineProgress(data, machineId, now))
              .filter(Boolean) as DashboardMachineProgress[])
        : [];

    return {
        streak: buildStreak(workoutDays, now),
        recentWorkoutDays,
        monthlyWorkoutDays,
        scheduledDayCount,
        totalMachinesScheduled,
        nextPlannedDayLabel: buildNextPlannedDayLabel(weekPlan, todayIndex),
        lastWorkoutLabel: lastWorkout ? formatRelativeDay(lastWorkout.date, now) : null,
        weekPlan,
        featuredPlanDay,
        machineProgress,
        hasHistory: workoutDays.length > 0,
    };
}

export function useDashboardSummary() {
    const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        const cachedData = await getCachedWorkoutData();
        setSummary(buildSummary(cachedData));

        const data = await loadWorkoutData();
        setSummary(buildSummary(data));
        setIsLoading(false);
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { summary, isLoading, refresh };
}
