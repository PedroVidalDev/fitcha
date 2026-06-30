import { useCallback, useEffect, useState } from 'react'
import { HistoryEntry, HistorySet } from '../dtos/HistoryEntry'
import { Machine } from '../dtos/Machine'
import { WorkoutPlan } from '../dtos/WorkoutPlan'
import { getCachedWorkoutData, loadWorkoutData } from '../services/workoutData'
import { getRecordHistoryEntry } from '../utils/workoutRecords'

type MachineWithHistory = Machine & {
    lastWeight: number | null
    lastSets: HistorySet[] | null
    recordSets: HistorySet[] | null
}

export function useWorkoutMachines(workoutId: number) {
    const [workout, setWorkout] = useState<WorkoutPlan | null>(null)
    const [machines, setMachines] = useState<MachineWithHistory[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const setMachinesFromData = useCallback(
        (data: {
            workoutOrder: number[]
            workouts: Record<string, WorkoutPlan>
            machines: Record<string, Machine>
            history: Record<string, HistoryEntry[]>
        }) => {
            const currentWorkout = data.workouts[String(workoutId)] ?? null
            setWorkout(currentWorkout)

            if (!currentWorkout) {
                setMachines([])
                return
            }

            const list = currentWorkout.machineIds
                .map((id) => {
                    const machine = data.machines[id]
                    if (!machine) return null
                    const hist = data.history[id] ?? []
                    const lastSets = hist[0]?.sets ?? null
                    const recordSets =
                        getRecordHistoryEntry(hist, machine)?.sets ?? null
                    const lastWeight =
                        lastSets && lastSets.length > 0
                            ? Math.max(...lastSets.map((set) => set.weight)) > 0
                                ? Math.max(...lastSets.map((set) => set.weight))
                                : null
                            : null
                    return { ...machine, lastWeight, lastSets, recordSets }
                })
                .filter(Boolean) as MachineWithHistory[]

            setMachines(list)
        },
        [workoutId],
    )

    const refresh = useCallback(async () => {
        setIsLoading(true)
        const cachedData = await getCachedWorkoutData()
        setMachinesFromData(cachedData)

        const data = await loadWorkoutData()
        setMachinesFromData(data)
        setIsLoading(false)
    }, [setMachinesFromData])

    useEffect(() => {
        refresh()
    }, [refresh])

    return { workout, machines, refresh, isLoading }
}
