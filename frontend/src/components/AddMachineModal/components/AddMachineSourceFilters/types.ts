import { type AddMachineSourceFilter } from '../../types'

export type AddMachineSourceFiltersProps = {
    sourceFilter: AddMachineSourceFilter
    onSelectFilter: (filter: AddMachineSourceFilter) => void
}
