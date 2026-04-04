import { GPTResponse, WizardData } from "../components/AIWizard/types";
import { ensureApiUrlConfigured, axiosApp } from "./axios";

type GenerateAIWorkoutResponse = GPTResponse;

function getAIWorkoutErrorMessage(error: unknown, fallback: string) {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response &&
        typeof error.response.data === "object" &&
        error.response.data !== null &&
        "error" in error.response.data &&
        typeof error.response.data.error === "string"
    ) {
        return error.response.data.error;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
}

export async function generateAIWorkout(data: WizardData): Promise<GenerateAIWorkoutResponse> {
    ensureApiUrlConfigured();

    try {
        const response = await axiosApp.post<GenerateAIWorkoutResponse>("/me/ai-workout/generate", {
            ...data,
        });

        return response.data;
    } catch (error) {
        throw new Error(
            getAIWorkoutErrorMessage(error, "Nao foi possivel gerar o treino automaticamente"),
        );
    }
}
