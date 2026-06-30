import { type AddMachineCatalogMachine } from '../../types'

export type AddMachineMachineListProps = {
    machines: AddMachineCatalogMachine[]
    selectedMachineId: string | null
    onSelectMachine: (machineId: string) => void
}
