import { MachineCategoryKey } from '@/src/constants/categories'
import { CatalogMachine } from '@/src/dtos/CatalogMachine'
import { TranslationKey } from '@/src/translates'

export type AddMachineModalProps = {
    visible: boolean
    onClose: () => void
    onAdd: (machine: AddMachineCatalogMachine) => void
    substitutionGroup?: string
    excludedMachineIds?: string[]
    titleKey?: TranslationKey
    actionLabelKey?: TranslationKey
}

export type AddMachineCategoryFilter = MachineCategoryKey | 'all'

export type AddMachineCatalogMachine = CatalogMachine
