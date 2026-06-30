import { type RefObject } from 'react'
import { type ScrollView } from 'react-native'
import { type WorkoutMachineProgressItem } from '../../types'

export type WorkoutMachineNavigatorProps = {
    machineNavScrollRef: RefObject<ScrollView | null>
    items: WorkoutMachineProgressItem[]
    canGoPrev: boolean
    canGoNext: boolean
    onPressPrevious: () => void
    onPressNext: () => void
    onSelectMachine: (index: number) => void
}
