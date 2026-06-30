import { MachineCategoryKey } from '../constants/categories'

export type MachineTrackingType = 'sets' | 'duration'

export type Machine = {
    id: string
    catalogMachineId?: string
    name: string
    description?: string
    photo?: string
    categoryKey: MachineCategoryKey
    trackingType: MachineTrackingType
    requiresWeight: boolean
}
