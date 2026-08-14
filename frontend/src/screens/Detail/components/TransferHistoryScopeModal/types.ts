import { HistoryTransferTarget } from '../HistoryTransferModal/types'

export type TransferHistoryScopeModalProps = {
    sourceName: string
    target: HistoryTransferTarget | null
    isBusy: boolean
    errorMessage?: string
    onCancel: () => void
    onTransfer: (replaceInWorkouts: boolean) => void
}
