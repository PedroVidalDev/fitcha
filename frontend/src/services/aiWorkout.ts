import { GPTResponse, WizardData } from '../components/AIWizard/types'
import { translateRuntime } from '../translates/runtime'
import { ensureApiUrlConfigured, axiosApp } from './axios'

type GenerateAIWorkoutResponse = GPTResponse & {
    remainingCredits: number
}

const aiWorkoutRequestTimeoutMs = 120000

function convertMinutesToHours(minutesPerDay: string): string {
    const trimmedMinutes = minutesPerDay.trim()
    if (trimmedMinutes === '') {
        return ''
    }

    const normalizedMinutes = trimmedMinutes.replace(',', '.')
    const parsedMinutes = Number(normalizedMinutes)
    if (!Number.isFinite(parsedMinutes)) {
        return trimmedMinutes
    }

    return String(parsedMinutes / 60)
}

function getAIWorkoutErrorMessage(error: unknown, fallback: string) {
    if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'error' in error.response.data &&
        typeof error.response.data.error === 'string'
    ) {
        return error.response.data.error
    }

    if (error instanceof Error && error.message) {
        return error.message
    }

    return fallback
}

export async function generateAIWorkout(
    data: WizardData,
): Promise<GenerateAIWorkoutResponse> {
    ensureApiUrlConfigured()

    try {
        const response = await axiosApp.post<GenerateAIWorkoutResponse>(
            '/me/ai-workout/generate',
            {
                ...data,
                daysPerWeek: data.selectedDays.length,
                height: data.height.trim(),
                weight: data.weight.trim(),
                hoursPerDay: convertMinutesToHours(data.hoursPerDay),
                machinesPerDay: data.machinesPerDay.trim(),
                workoutSplit: data.workoutSplit.trim(),
                customInstructions: data.customInstructions.trim(),
            },
            {
                timeout: aiWorkoutRequestTimeoutMs,
            },
        )

        return response.data
    } catch (error) {
        throw new Error(
            getAIWorkoutErrorMessage(
                error,
                translateRuntime('services.aiWorkout.generateError'),
            ),
        )
    }
}
