export type RootStackParamList = {
    Login: undefined;
    Register: undefined;

    Week: undefined;
    Day: { dayIndex: number };
    MachineDetail: { machineId: string };
    Workout: { dayIndex: number };
};