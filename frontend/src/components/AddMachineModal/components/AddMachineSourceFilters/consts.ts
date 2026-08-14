import { AddMachineSourceFilter } from '../../types'

export const FILTERS: Array<{
    key: AddMachineSourceFilter
    labelKey: 'customMachines.pickerMyMachines' | 'customMachines.pickerCatalog'
}> = [
    {
        key: 'custom',
        labelKey: 'customMachines.pickerMyMachines',
    },
    {
        key: 'catalog',
        labelKey: 'customMachines.pickerCatalog',
    },
]
