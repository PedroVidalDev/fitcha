import { isAxiosError } from 'axios'
import { CatalogMachine } from '../dtos/CatalogMachine'
import { translateRuntime } from '../translates/runtime'
import { axiosApp, ensureApiUrlConfigured } from './axios'

function getCatalogMachineErrorMessage(error: unknown, fallback: string) {
    if (isAxiosError(error)) {
        const responseData = error.response?.data

        if (
            responseData &&
            typeof responseData === 'object' &&
            'error' in responseData &&
            typeof responseData.error === 'string' &&
            responseData.error.trim()
        ) {
            return responseData.error
        }
    }

    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return fallback
}

export async function getCatalogMachines() {
    ensureApiUrlConfigured()

    try {
        const response =
            await axiosApp.get<CatalogMachine[]>('/machines/catalog')
        return response.data
    } catch (error) {
        throw new Error(
            getCatalogMachineErrorMessage(
                error,
                translateRuntime('services.machines.loadError'),
            ),
        )
    }
}
