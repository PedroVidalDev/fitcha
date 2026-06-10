export type RootStackParamList = {
    Login: undefined
    Register: undefined

    Home: undefined
    Week: undefined
    Profile: undefined
    Day: { workoutId: number }
    MachineDetail: { machineId: string }
    Workout: { workoutId: number; resume?: boolean }
}
