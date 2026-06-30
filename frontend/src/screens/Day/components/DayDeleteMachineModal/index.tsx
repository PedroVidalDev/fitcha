import { ConfirmModal } from '@/src/components/ConfirmModal'
import { useI18n } from '@/src/contexts/I18nContext'
import { type DayDeleteMachineModalProps } from './types'

export function DayDeleteMachineModal(props: DayDeleteMachineModalProps) {
    const { target, onClose, onConfirm } = props
    const { t: translate } = useI18n()

    return (
        <ConfirmModal
            visible={!!target}
            title={translate('day.remove.title')}
            message={translate('day.remove.message', {
                name: target?.name ?? '',
            })}
            confirmLabel={translate('common.actions.remove')}
            onClose={onClose}
            onConfirm={onConfirm}
        />
    )
}
