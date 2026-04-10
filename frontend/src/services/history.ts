import { isAxiosError } from "axios";
import { axiosApp, ensureApiUrlConfigured } from "./axios";

export type HistoryApiEntry = {
    id: string;
    machineId: string;
    sets: [number, number, number];
    date: string;
};

export type WorkoutHistoryInput = {
    machineId: string;
    sets: [number, number, number];
};

function getHistoryErrorMessage(error: unknown, fallback: string) {
    if (isAxiosError(error)) {
        const responseData = error.response?.data;

        if (
            responseData &&
            typeof responseData === "object" &&
            "error" in responseData &&
            typeof responseData.error === "string" &&
            responseData.error.trim()
        ) {
            return responseData.error;
        }
    }

    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return fallback;
}

export async function getMyHistory() {
    ensureApiUrlConfigured();

    try {
        const response = await axiosApp.get<HistoryApiEntry[]>("/me/history");
        return response.data;
    } catch (error) {
        throw new Error(getHistoryErrorMessage(error, "Nao foi possivel carregar o historico"));
    }
}

export async function createWorkoutHistory(results: WorkoutHistoryInput[]) {
    ensureApiUrlConfigured();

    try {
        const response = await axiosApp.post<HistoryApiEntry[]>("/me/history/workouts", {
            results,
        });
        return response.data;
    } catch (error) {
        throw new Error(getHistoryErrorMessage(error, "Nao foi possivel salvar o treino"));
    }
}
