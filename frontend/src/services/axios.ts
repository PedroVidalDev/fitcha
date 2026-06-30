import axios from 'axios'
import { translateRuntime } from '../translates/runtime'

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim()
const normalizedApiUrl = apiUrl ? apiUrl.replace(/\/+$/, '') : undefined
let authSessionExpiredHandler: (() => Promise<void> | void) | null = null
let isHandlingUnauthorizedResponse = false

export const axiosApp = axios.create({
    baseURL: normalizedApiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
})

axiosApp.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status
        const authHeader =
            error.config?.headers?.Authorization ??
            error.config?.headers?.authorization ??
            axiosApp.defaults.headers.common.Authorization

        const isAuthenticatedRequest =
            typeof authHeader === 'string' &&
            authHeader.trim().startsWith('Bearer ')

        if (
            status === 401 &&
            isAuthenticatedRequest &&
            authSessionExpiredHandler &&
            !isHandlingUnauthorizedResponse
        ) {
            isHandlingUnauthorizedResponse = true

            try {
                await Promise.resolve(authSessionExpiredHandler())
            } finally {
                isHandlingUnauthorizedResponse = false
            }
        }

        return Promise.reject(error)
    },
)

export function ensureApiUrlConfigured() {
    if (!normalizedApiUrl) {
        throw new Error(translateRuntime('services.axios.missingApiUrl'))
    }
}

export function setAxiosAuthToken(token: string | null) {
    isHandlingUnauthorizedResponse = false

    if (token) {
        axiosApp.defaults.headers.common.Authorization = `Bearer ${token}`
        return
    }

    delete axiosApp.defaults.headers.common.Authorization
}

export function setAxiosAuthSessionExpiredHandler(
    handler: (() => Promise<void> | void) | null,
) {
    authSessionExpiredHandler = handler
}
