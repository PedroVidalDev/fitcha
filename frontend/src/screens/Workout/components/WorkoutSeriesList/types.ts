import {
    type WorkoutDraftFieldKey,
    type WorkoutSeriesField,
    type WorkoutSetKey,
} from '../../types'

export type WorkoutSeriesListProps = {
    machineId: string
    items: WorkoutSeriesField[]
    hasLockedSeries: boolean
    onChangeField: (
        field: WorkoutSetKey,
        draftField: WorkoutDraftFieldKey,
        value: string,
    ) => void
    onConfirmField: (field: WorkoutSetKey) => void
}
