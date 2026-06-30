import { type DayDeleteTarget } from '../../types'

export type DayDeleteMachineModalProps = {
    target: DayDeleteTarget | null
    onClose: () => void
    onConfirm: () => void
}
