import { type TranslationKey } from '@/src/translates'

export type AddMachineFooterActionsProps = {
    canAdd: boolean
    onClose: () => void
    onAdd: () => void
    actionLabelKey?: TranslationKey
}
