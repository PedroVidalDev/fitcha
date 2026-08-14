import { MachineCategoryKey } from '@/src/constants/categories'
import { Machine, MachineTrackingType } from '@/src/dtos/Machine'

export type HistoryTransferTarget = {
    key: string
    kind: 'userMachine' | 'catalog'
    id: string
    name: string
    description?: string
    photo?: string
    categoryKey: MachineCategoryKey
    trackingType: MachineTrackingType
    requiresWeight: boolean
    searchTerms: string[]
}

export type HistoryTransferModalProps = {
    visible: boolean
    sourceMachine: Machine
    onClose: () => void
    onContinue: (target: HistoryTransferTarget) => void
}
