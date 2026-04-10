import { isAxiosError } from "axios";
import { PlanCheckoutResponse, PlanStatusResponse } from "../@types/plan";
import { axiosApp, ensureApiUrlConfigured } from "./axios";

function getPlanErrorMessage(error: unknown, fallback: string) {
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

export async function getMyPlanStatus() {
    ensureApiUrlConfigured();

    try {
        const response = await axiosApp.get<PlanStatusResponse>("/me/plan");
        return response.data;
    } catch (error) {
        throw new Error(getPlanErrorMessage(error, "Não foi possível carregar o plano"));
    }
}

export async function createPlanCheckout(documentNumber: string) {
    ensureApiUrlConfigured();

    try {
        const response = await axiosApp.post<PlanCheckoutResponse>("/me/plan/checkout", {
            documentNumber,
        });

        return response.data;
    } catch (error) {
        throw new Error(getPlanErrorMessage(error, "Não foi possível gerar o Pix"));
    }
}
