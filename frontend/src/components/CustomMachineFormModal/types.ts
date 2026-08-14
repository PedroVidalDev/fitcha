import { Machine } from '@/src/dtos/Machine'
import { CreateMachineInput } from '@/src/services/machines'

export type CustomMachineFormModalProps = {
    visible: boolean
    machine?: Machine | null
    onClose: () => void
    onSubmit: (input: CreateMachineInput) => Promise<void>
}
