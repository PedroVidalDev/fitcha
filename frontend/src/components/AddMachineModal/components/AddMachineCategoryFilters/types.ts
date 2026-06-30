import { type AddMachineCategoryFilter } from '../../types'

export type AddMachineCategoryFiltersProps = {
    categoryFilter: AddMachineCategoryFilter
    onSelectFilter: (filter: AddMachineCategoryFilter) => void
}
