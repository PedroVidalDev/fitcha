import { isAxiosError } from "axios";
import { Machine } from "../dtos/Machine";
import { axiosApp, ensureApiUrlConfigured } from "./axios";

type UpdateMachineInput = Partial<Pick<Machine, "name" | "description" | "photo" | "categoryKey">>;

function getMachineErrorMessage(error: unknown, fallback: string) {
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

export async function getMyMachines() {
    ensureApiUrlConfigured();

    try {
        const response = await axiosApp.get<Machine[]>("/me/machines");
        return response.data;
    } catch (error) {
        throw new Error(getMachineErrorMessage(error, "Nao foi possivel carregar as maquinas"));
    }
}

export async function updateMachine(machineId: string, input: UpdateMachineInput) {
    ensureApiUrlConfigured();

    try {
        const response = await axiosApp.patch<Machine>(`/me/machines/${machineId}`, input);
        return response.data;
    } catch (error) {
        throw new Error(getMachineErrorMessage(error, "Nao foi possivel atualizar a maquina"));
    }
}
