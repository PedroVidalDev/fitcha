import { MachineCategoryKey } from '../constants/categories'

export type Machine = {
    id: string
    catalogMachineId?: string
    name: string
    description?: string
    photo?: string
    categoryKey: MachineCategoryKey
}
