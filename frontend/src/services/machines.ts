import { isAxiosError } from 'axios'
import { Machine } from '../dtos/Machine'
import { PageResponse } from '../dtos/Page'
import { translateRuntime } from '../translates/runtime'
import { axiosApp, ensureApiUrlConfigured } from './axios'

export type UpdateMachineInput = Partial<
    Pick<
        Machine,
        | 'name'
        | 'description'
        | 'photo'
        | 'categoryKey'
        | 'trackingType'
        | 'requiresWeight'
    >
>

export type CreateMachineInput = Pick<
    Machine,
    'name' | 'categoryKey' | 'trackingType' | 'requiresWeight'
> &
    Partial<Pick<Machine, 'description' | 'photo'>>

export type MachineSearchParams = {
    source?: 'custom' | 'catalog'
    q?: string
    categoryKey?: string
    trackingType?: Machine['trackingType']
    requiresWeight?: boolean
    excludeIds?: string
    page?: number
    limit?: number
}

function getMachineErrorMessage(error: unknown, fallback: string) {
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

export async function getMyMachines() {
    ensureApiUrlConfigured()

    try {
        const response = await axiosApp.get<Machine[]>('/me/machines')
        return response.data
    } catch (error) {
        throw new Error(
            getMachineErrorMessage(
                error,
                translateRuntime('services.machines.loadError'),
            ),
        )
    }
}

export async function getMachine(machineId: string) {
    ensureApiUrlConfigured()

    try {
        const response = await axiosApp.get<Machine>(
            `/me/machines/${machineId}`,
        )
        return response.data
    } catch (error) {
        throw new Error(
            getMachineErrorMessage(
                error,
                translateRuntime('services.machines.loadError'),
            ),
        )
    }
}

export async function searchMyMachines(params: MachineSearchParams) {
    ensureApiUrlConfigured()

    try {
        const response = await axiosApp.get<PageResponse<Machine>>(
            '/me/machines/search',
            { params },
        )
        return response.data
    } catch (error) {
        throw new Error(
            getMachineErrorMessage(
                error,
                translateRuntime('services.machines.loadError'),
            ),
        )
    }
}

export async function createMachine(input: CreateMachineInput) {
    ensureApiUrlConfigured()

    try {
        const response = await axiosApp.post<Machine>('/me/machines', input)
        return response.data
    } catch (error) {
        throw new Error(
            getMachineErrorMessage(
                error,
                translateRuntime('services.machines.createError'),
            ),
        )
    }
}

export async function updateMachine(
    machineId: string,
    input: UpdateMachineInput,
) {
    ensureApiUrlConfigured()

    try {
        const response = await axiosApp.patch<Machine>(
            `/me/machines/${machineId}`,
            input,
        )
        return response.data
    } catch (error) {
        throw new Error(
            getMachineErrorMessage(
                error,
                translateRuntime('services.machines.updateError'),
            ),
        )
    }
}

export async function deleteMachine(machineId: string) {
    ensureApiUrlConfigured()

    try {
        await axiosApp.delete(`/me/machines/${machineId}`)
    } catch (error) {
        throw new Error(
            getMachineErrorMessage(
                error,
                translateRuntime('services.machines.deleteError'),
            ),
        )
    }
}

function getPhotoFileInfo(uri: string) {
    const normalizedUri = uri.split('?')[0].toLowerCase()
    if (normalizedUri.endsWith('.png')) {
        return { name: 'machine-photo.png', type: 'image/png' }
    }
    if (normalizedUri.endsWith('.webp')) {
        return { name: 'machine-photo.webp', type: 'image/webp' }
    }

    return { name: 'machine-photo.jpg', type: 'image/jpeg' }
}

export async function uploadMachinePhoto(machineId: string, uri: string) {
    ensureApiUrlConfigured()

    const fileInfo = getPhotoFileInfo(uri)
    const formData = new FormData()
    formData.append('photo', {
        uri,
        name: fileInfo.name,
        type: fileInfo.type,
    } as unknown as Blob)

    try {
        const response = await axiosApp.post<Machine>(
            `/me/machines/${machineId}/photo`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        )
        return response.data
    } catch (error) {
        throw new Error(
            getMachineErrorMessage(
                error,
                translateRuntime('services.machines.photoError'),
            ),
        )
    }
}

export async function deleteMachinePhoto(machineId: string) {
    ensureApiUrlConfigured()

    try {
        const response = await axiosApp.delete<Machine>(
            `/me/machines/${machineId}/photo`,
        )
        return response.data
    } catch (error) {
        throw new Error(
            getMachineErrorMessage(
                error,
                translateRuntime('services.machines.photoError'),
            ),
        )
    }
}
