export type RootStackParamList = {
    Login: undefined
    Register: undefined

    Home: undefined
    Week: undefined
    Profile: undefined
    Day: { workoutId: number }
    MachineDetail: { machineId: string }
    CustomMachines: undefined
    Workout: { workoutId: number; resume?: boolean }
}
