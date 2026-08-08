import { View } from 'react-native'
import { AddMachineMachineCard } from '../AddMachineMachineCard'
import { type AddMachineMachineListProps } from './types'

export function AddMachineMachineList(props: AddMachineMachineListProps) {
    const { machines, selectedMachineId, onSelectMachine } = props

    return (
        <View style={{ gap: 10 }}>
            {machines.map((machine) => (
                <AddMachineMachineCard
                    key={machine.id}
                    machine={machine}
                    isSelected={selectedMachineId === machine.key}
                    onPress={() => onSelectMachine(machine.key)}
                />
            ))}
        </View>
    )
}
