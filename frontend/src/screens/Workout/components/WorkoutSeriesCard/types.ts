import {
    type WorkoutDraftFieldKey,
    type WorkoutSeriesField,
    type WorkoutSetKey,
} from '../../types'

export type WorkoutSeriesCardProps = {
    item: WorkoutSeriesField
    onChangeField: (
        field: WorkoutSetKey,
        draftField: WorkoutDraftFieldKey,
        value: string,
    ) => void
    onConfirmField: (field: WorkoutSetKey) => void
}
