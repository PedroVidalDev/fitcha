import { ConfirmModal } from '@/src/components/ConfirmModal'
import { type WorkoutConfirmModalProps } from './types'

export function WorkoutConfirmModal(props: WorkoutConfirmModalProps) {
    const { modal, onClose, onConfirm } = props

    return (
        <ConfirmModal
            visible={!!modal}
            title={modal?.title ?? ''}
            message={modal?.message ?? ''}
            confirmLabel={modal?.confirmLabel}
            cancelLabel={modal?.cancelLabel}
            hideCancel={modal?.hideCancel}
            confirmVariant={modal?.confirmVariant}
            onClose={onClose}
            onConfirm={onConfirm}
        />
    )
}
