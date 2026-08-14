import { type WorkoutPrCelebrationState } from '../../types'

export type WorkoutPrCelebrationProps = {
    celebration: WorkoutPrCelebrationState | null
    onFinished: () => void
}
