import { ConfirmModal } from '@/src/components/ConfirmModal'
import { useI18n } from '@/src/contexts/I18nContext'
import { type DayDeleteWorkoutModalProps } from './types'

export function DayDeleteWorkoutModal(props: DayDeleteWorkoutModalProps) {
    const { visible, workoutTitle, onClose, onConfirm } = props
    const { t: translate } = useI18n()

    return (
        <ConfirmModal
            visible={visible}
            title={translate('day.removeWorkout.title')}
            message={translate('day.removeWorkout.message', {
                name: workoutTitle,
            })}
            confirmLabel={translate('common.actions.remove')}
            onClose={onClose}
            onConfirm={onConfirm}
        />
    )
}
