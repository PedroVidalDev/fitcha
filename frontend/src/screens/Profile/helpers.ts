export function formatDate(value: string | null | undefined, locale: string) {
    if (!value) return null

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null

    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date)
}

export function getUserInitial(name: string) {
    return name.trim().charAt(0).toUpperCase() || 'U'
}
