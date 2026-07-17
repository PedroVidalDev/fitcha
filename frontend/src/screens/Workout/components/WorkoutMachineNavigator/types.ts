import { type RefObject } from 'react'
import { type ScrollView } from 'react-native'
import { type WorkoutMachineProgressItem } from '../../types'

export type WorkoutMachineNavigatorProps = {
    machineNavScrollRef: RefObject<ScrollView | null>
    items: WorkoutMachineProgressItem[]
    canGoPrev: boolean
    canGoNext: boolean
    canRemoveMachine: boolean
    onPressPrevious: () => void
    onPressNext: () => void
    onPressAddMachine: () => void
    onPressRemoveMachine: () => void
    onSelectMachine: (index: number) => void
}
