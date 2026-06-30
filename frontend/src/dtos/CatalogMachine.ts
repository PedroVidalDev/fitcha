import { MachineCategoryKey } from '../constants/categories'
import { MachineTrackingType } from './Machine'

export type CatalogMachine = {
    id: string
    slug: string
    name: string
    description?: string
    photo?: string
    categoryKey: MachineCategoryKey
    trackingType: MachineTrackingType
    requiresWeight: boolean
    aliases: string[]
}
