import { type ProfileFormValues, type UseProfileFormResult } from '../../types'

export type ProfilePasswordSectionProps = {
    values: ProfileFormValues
    errors: UseProfileFormResult['errors']
    isSubmitting: boolean
    setField: UseProfileFormResult['setField']
    onSave: () => void
}
