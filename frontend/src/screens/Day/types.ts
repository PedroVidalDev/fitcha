import { type useWorkoutMachines } from '@/src/hooks/useWorkoutMachines'
import { RootStackParamList } from '@/src/router/types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

export type DayScreenProps = NativeStackScreenProps<RootStackParamList, 'Day'>

export type UseDayScreenParams = Pick<DayScreenProps, 'navigation'> & {
    workoutId: number
}

export type DayWorkout = NonNullable<
    ReturnType<typeof useWorkoutMachines>['workout']
>

export type DayMachine = ReturnType<
    typeof useWorkoutMachines
>['machines'][number]

export type DayDeleteTarget = {
    id: string
    name: string
}
