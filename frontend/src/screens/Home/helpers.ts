import { HistorySet } from '@/src/dtos/HistoryEntry'
import { MachineTrackingType } from '@/src/dtos/Machine'
import { DashboardPlanDay } from '@/src/hooks/useDashboardSummary'
import {
    formatHistoryMetricValue,
    formatSetSequence,
    type HistoryMetricKind,
} from '@/src/utils/workoutRecords'

export function formatDelta(
    value: number | null,
    metricKind: HistoryMetricKind,
    t: (
        key: 'home.delta.noBase' | 'home.delta.zero',
        params?: Record<string, number | string>,
    ) => string,
) {
    if (value === null) return t('home.delta.noBase')
    if (value > 0)
        return `+${formatHistoryMetricValue(value, metricKind).replace('+', '')}`
    if (value < 0)
        return `-${formatHistoryMetricValue(Math.abs(value), metricKind)}`
    return t('home.delta.zero')
}

export function getFeaturedPlanCopy(
    featuredPlanDay: DashboardPlanDay | null,
    t: (
        key:
            | 'home.featured.emptyTitle'
            | 'home.featured.emptySubtitle'
            | 'home.featured.todayTitle'
            | 'home.featured.todaySubtitle'
            | 'home.featured.nextTitle'
            | 'home.featured.nextSubtitle',
        params?: Record<string, number | string>,
    ) => string,
) {
    if (!featuredPlanDay) {
        return {
            title: t('home.featured.emptyTitle'),
            subtitle: t('home.featured.emptySubtitle'),
        }
    }

    if (featuredPlanDay.isToday) {
        return {
            title: t('home.featured.todayTitle'),
            subtitle: t('home.featured.todaySubtitle'),
        }
    }

    return {
        title: t('home.featured.nextTitle', {
            day: featuredPlanDay.label.toLowerCase(),
        }),
        subtitle: t('home.featured.nextSubtitle'),
    }
}

export function getFirstName(name?: string, fallback = 'athlete') {
    const [firstName] = name?.trim().split(/\s+/) ?? []
    return firstName || fallback
}

export function formatMetric(
    value: number | null,
    metricKind: HistoryMetricKind,
) {
    return formatHistoryMetricValue(value, metricKind)
}

export function formatRecord(
    value: HistorySet[] | null,
    trackingType: MachineTrackingType,
    requiresWeight: boolean,
) {
    return value === null
        ? '--'
        : formatSetSequence(value, ' / ', { trackingType, requiresWeight })
}
