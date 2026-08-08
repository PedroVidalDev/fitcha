import { type AddMachineOption } from '../../types'

export type AddMachineMachineListProps = {
    machines: AddMachineOption[]
    selectedMachineId: string | null
    onSelectMachine: (machineId: string) => void
}
