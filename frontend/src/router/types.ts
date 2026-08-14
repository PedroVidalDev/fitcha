import { type NavigatorScreenParams } from '@react-navigation/native'

export type MainTabParamList = {
    Home: undefined
    Week: undefined
    CustomMachines: undefined
    Profile: undefined
}

export type RootStackParamList = {
    Login: undefined
    Register: undefined

    MainTabs: NavigatorScreenParams<MainTabParamList> | undefined
    Day: { workoutId: number }
    MachineDetail: { machineId: string }
    Workout: { workoutId: number; resume?: boolean }
}
