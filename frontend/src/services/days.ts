import { isAxiosError } from "axios";
import { Machine } from "../dtos/Machine";
import { axiosApp, ensureApiUrlConfigured } from "./axios";

export type DayResponse = {
    dayIndex: number;
    machineIds: string[];
};

export type DayMachineInput = Omit<Machine, "id">;

export type AddDayMachineResponse = {
    day: DayResponse;
    machine: Machine;
};

export type RemoveDayMachineResponse = {
    day: DayResponse;
    removedMachine: boolean;
};

export type ReplaceWeekDayInput = {
    dayIndex: number;
    machines: DayMachineInput[];
};

export type ReplaceWeekResponse = {
    days: DayResponse[];
    machines: Machine[];
};

function getDayErrorMessage(error: unknown, fallback: string) {
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

export async function getMyDays() {
    ensureApiUrlConfigured();

    try {
        const response = await axiosApp.get<DayResponse[]>("/me/days");
        return response.data;
    } catch (error) {
        throw new Error(getDayErrorMessage(error, "Não foi possível carregar os dias"));
    }
}

export async function addMachineToDay(dayIndex: number, input: DayMachineInput) {
    ensureApiUrlConfigured();

    try {
        const response = await axiosApp.post<AddDayMachineResponse>(
            `/me/days/${dayIndex}/machines`,
            input,
        );
        return response.data;
    } catch (error) {
        throw new Error(getDayErrorMessage(error, "Não foi possível adicionar a máquina"));
    }
}

export async function removeMachineFromDay(dayIndex: number, machineId: string) {
    ensureApiUrlConfigured();

    try {
        const response = await axiosApp.delete<RemoveDayMachineResponse>(
            `/me/days/${dayIndex}/machines/${machineId}`,
        );
        return response.data;
    } catch (error) {
        throw new Error(getDayErrorMessage(error, "Não foi possível remover a máquina"));
    }
}

export async function replaceWeek(days: ReplaceWeekDayInput[]) {
    ensureApiUrlConfigured();

    try {
        const response = await axiosApp.put<ReplaceWeekResponse>("/me/days/week", {
            days,
        });
        return response.data;
    } catch (error) {
        throw new Error(getDayErrorMessage(error, "Não foi possível substituir a semana"));
    }
}
