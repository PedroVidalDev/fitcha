export type StepPreferencesProps = {
    hoursPerDay: string;
    machinesPerDay: string;
    workoutSplit: string;
    onHoursPerDayChange: (value: string) => void;
    onMachinesPerDayChange: (value: string) => void;
    onWorkoutSplitChange: (value: string) => void;
};
