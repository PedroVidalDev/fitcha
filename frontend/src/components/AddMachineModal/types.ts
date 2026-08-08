import { MachineCategoryKey } from '@/src/constants/categories'
import { MachineTrackingType } from '@/src/dtos/Machine'
import { TranslationKey } from '@/src/translates'

export type AddMachineModalProps = {
    visible: boolean
    onClose: () => void
    onAdd: (machine: AddMachineOption) => void | Promise<void>
    substitutionGroup?: string
    excludedMachineIds?: string[]
    excludedUserMachineIds?: string[]
    hideCategoryFilters?: boolean
    titleKey?: TranslationKey
    actionLabelKey?: TranslationKey
}

export type AddMachineCategoryFilter = MachineCategoryKey | 'all'

export type AddMachineOption = {
    key: string
    kind: 'catalog' | 'custom'
    id: string
    name: string
    description?: string
    photo?: string
    categoryKey: MachineCategoryKey
    substitutionGroup?: string
    trackingType: MachineTrackingType
    requiresWeight: boolean
    searchTerms: string[]
}
