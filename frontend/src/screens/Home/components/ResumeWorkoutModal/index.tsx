import { ConfirmModal } from '@/src/components/ConfirmModal'
import { useI18n } from '@/src/contexts/I18nContext'
import { type ResumeWorkoutModalProps } from './types'

export function ResumeWorkoutModal(props: ResumeWorkoutModalProps) {
    const { activeWorkoutSession, onClose, onConfirm } = props
    const { t: translate } = useI18n()

    return (
        <ConfirmModal
            visible={!!activeWorkoutSession}
            title={translate('workout.resume.title')}
            message={translate('workout.resume.message')}
            confirmLabel={translate('workout.resume.confirm')}
            cancelLabel={translate('workout.resume.cancel')}
            confirmVariant='accent'
            onClose={onClose}
            onConfirm={onConfirm}
        />
    )
}
