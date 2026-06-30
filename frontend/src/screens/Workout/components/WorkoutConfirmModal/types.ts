import { type WorkoutModalConfig } from '../../types'

export type WorkoutConfirmModalProps = {
    modal: WorkoutModalConfig | null
    onClose: () => void
    onConfirm: () => void
}
