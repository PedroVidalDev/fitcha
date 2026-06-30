import { type DayMachine } from '../../types'

export type DayMachineCardProps = {
    item: DayMachine
    index: number
    onPress: () => void
    onLongPress: () => void
}
