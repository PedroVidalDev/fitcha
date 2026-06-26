import { type useWorkoutMachines } from '@/src/hooks/useWorkoutMachines'
import { RootStackParamList } from '@/src/router/types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { HistorySet } from '../../dtos/HistoryEntry'

export type WorkoutScreenProps = NativeStackScreenProps<
    RootStackParamList,
    'Workout'
>

export type UseWorkoutScreenParams = Pick<
    WorkoutScreenProps,
    'navigation' | 'route'
>

export type WorkoutMachine = ReturnType<
    typeof useWorkoutMachines
>['machines'][number]

export type WorkoutResult = { machineId: string; sets: HistorySet[] }
export type WorkoutSetKey = 'set1' | 'set2' | 'set3'
export type WorkoutDraftFieldKey = 'weight' | 'reps'
export type WorkoutSetDraft = {
    weight: string
    reps: string
}
export type WorkoutDraft = {
    sets: Record<WorkoutSetKey, WorkoutSetDraft>
    confirmed: Record<WorkoutSetKey, boolean>
}
export type WorkoutDraftMap = Record<string, WorkoutDraft>
export const WORKOUT_SET_KEYS: WorkoutSetKey[] = ['set1', 'set2', 'set3']

export type WorkoutModalConfig = {
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    hideCancel?: boolean
    confirmVariant?: 'danger' | 'accent'
    onConfirm: () => void
}

export type WorkoutSeriesField = {
    key: WorkoutSetKey
    label: string
    weightValue: string
    repsValue: string
    weightPlaceholder: string
    repsPlaceholder: string
    isConfirmed: boolean
    isLocked: boolean
    canConfirm: boolean
}

export type WorkoutMachineProgressItem = {
    id: string
    position: number
    isCurrent: boolean
    hasDraft: boolean
    isComplete: boolean
}
