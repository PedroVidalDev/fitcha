import { type DayMachine } from '../../types'

export type DayMachineListProps = {
    machines: DayMachine[]
    onPressMachine: (machineId: string) => void
    onLongPressMachine: (machine: DayMachine) => void
}
