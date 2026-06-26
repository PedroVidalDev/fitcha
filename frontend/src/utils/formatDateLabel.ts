type Translate = (
    key:
        | 'common.relative.today'
        | 'common.relative.yesterday'
        | 'common.relative.daysAgo'
        | 'common.relative.weekAgo'
        | 'common.relative.weeksAgo',
    params?: Record<string, number | string>,
) => string

export function formatDateLabel(
    dateStr: string,
    locale: string,
    t: Translate,
): string {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor(
        (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (diff === 0) return t('common.relative.today')
    if (diff === 1) return t('common.relative.yesterday')
    if (diff < 7) return t('common.relative.daysAgo', { count: diff })
    if (diff < 14) return t('common.relative.weekAgo')
    if (diff < 30)
        return t('common.relative.weeksAgo', { count: Math.floor(diff / 7) })
    return d.toLocaleDateString(locale)
}
