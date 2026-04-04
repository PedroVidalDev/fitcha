import axios from "axios";

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const normalizedApiUrl = apiUrl ? apiUrl.replace(/\/+$/, "") : undefined;

export const axiosApp = axios.create({
    baseURL: normalizedApiUrl,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000,
});

export function ensureApiUrlConfigured() {
    if (!normalizedApiUrl) {
        throw new Error("Configure EXPO_PUBLIC_API_URL no arquivo frontend/.env");
    }
}

export function setAxiosAuthToken(token: string | null) {
    if (token) {
        axiosApp.defaults.headers.common.Authorization = `Bearer ${token}`;
        return;
    }

    delete axiosApp.defaults.headers.common.Authorization;
}
