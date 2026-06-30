import { type ActiveWorkoutSession } from '@/src/services/activeWorkout'

export type ResumeWorkoutModalProps = {
    activeWorkoutSession: ActiveWorkoutSession | null
    onClose: () => void
    onConfirm: () => void
}
