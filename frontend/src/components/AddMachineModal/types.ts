import { MachineCategoryKey } from '@/src/constants/categories'
import { CatalogMachine } from '@/src/dtos/CatalogMachine'

export type AddMachineModalProps = {
    visible: boolean
    onClose: () => void
    onAdd: (machine: AddMachineCatalogMachine) => void
}

export type AddMachineCategoryFilter = MachineCategoryKey | 'all'

export type AddMachineCatalogMachine = CatalogMachine
