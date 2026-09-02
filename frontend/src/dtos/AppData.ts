import { HistorySummary } from './HistorySummary'
import { Machine } from './Machine'
import { WorkoutPlan } from './WorkoutPlan'

export type AppData = {
    machines: Record<string, Machine>
    workouts: Record<string, WorkoutPlan>
    workoutOrder: number[]
    historySummary: HistorySummary
}
