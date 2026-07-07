import {
    formatHistoryMetricValue,
    type HistoryMetricKind,
} from '../../utils/workoutRecords'

type DetailTranslate = (
    key:
        | 'detail.record.volume'
        | 'detail.record.duration'
        | 'detail.record.reps'
        | 'detail.progress.metric.weight'
        | 'detail.progress.metric.duration'
        | 'detail.progress.metric.reps',
    params?: Record<string, number | string>,
) => string

export function formatDetailPrimaryMetric(
    value: number,
    metricKind: HistoryMetricKind,
    t: DetailTranslate,
) {
    if (metricKind === 'weight') {
        return t('detail.record.volume', { volume: value })
    }

    return t(
        metricKind === 'duration'
            ? 'detail.record.duration'
            : 'detail.record.reps',
        {
            value: formatHistoryMetricValue(value, metricKind),
        },
    )
}

export function getDetailProgressMetricLabel(
    metricKind: HistoryMetricKind,
    t: DetailTranslate,
) {
    return t(
        metricKind === 'weight'
            ? 'detail.progress.metric.weight'
            : metricKind === 'duration'
              ? 'detail.progress.metric.duration'
              : 'detail.progress.metric.reps',
    )
}
