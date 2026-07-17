import { MachineCategoryKey } from '../constants/categories'
import { MachineTrackingType } from './Machine'

export type CatalogMachine = {
    id: string
    slug: string
    name: string
    description?: string
    photo?: string
    categoryKey: MachineCategoryKey
    substitutionGroup?: string
    trackingType: MachineTrackingType
    requiresWeight: boolean
    aliases: string[]
}
