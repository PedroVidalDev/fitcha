export const MACHINE_CATEGORIES = [
    {
        key: 'peito',
        label: 'Peito',
        labelKey: 'categories.peito',
        color: '#E24B4A',
    },
    {
        key: 'costas',
        label: 'Costas',
        labelKey: 'categories.costas',
        color: '#378ADD',
    },
    {
        key: 'pernas',
        label: 'Pernas',
        labelKey: 'categories.pernas',
        color: '#639922',
    },
    {
        key: 'ombros',
        label: 'Ombros',
        labelKey: 'categories.ombros',
        color: '#F4A261',
    },
    {
        key: 'biceps',
        label: 'Bíceps',
        labelKey: 'categories.biceps',
        color: '#D4537E',
    },
    {
        key: 'triceps',
        label: 'Tríceps',
        labelKey: 'categories.triceps',
        color: '#7F77DD',
    },
    {
        key: 'core',
        label: 'Core',
        labelKey: 'categories.core',
        color: '#1D9E75',
    },
    {
        key: 'cardio',
        label: 'Cardio',
        labelKey: 'categories.cardio',
        color: '#D85A30',
    },
] as const

export type MachineCategoryKey = (typeof MACHINE_CATEGORIES)[number]['key']

export const getCategoryByKey = (key: string) =>
    MACHINE_CATEGORIES.find((c) => c.key === key) ?? MACHINE_CATEGORIES[0]

export const DAYS_LABEL = [
    'Domingo',
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado',
]
export const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export const DAY_LABEL_KEYS = [
    'common.days.sunday',
    'common.days.monday',
    'common.days.tuesday',
    'common.days.wednesday',
    'common.days.thursday',
    'common.days.friday',
    'common.days.saturday',
] as const

export const DAY_SHORT_LABEL_KEYS = [
    'common.daysShort.sunday',
    'common.daysShort.monday',
    'common.daysShort.tuesday',
    'common.daysShort.wednesday',
    'common.daysShort.thursday',
    'common.daysShort.friday',
    'common.daysShort.saturday',
] as const

export function getDayLabelKey(dayIndex: number) {
    return DAY_LABEL_KEYS[dayIndex] ?? DAY_LABEL_KEYS[0]
}

export function getDayShortLabelKey(dayIndex: number) {
    return DAY_SHORT_LABEL_KEYS[dayIndex] ?? DAY_SHORT_LABEL_KEYS[0]
}
