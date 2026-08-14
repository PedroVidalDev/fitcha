import { Machine } from '../dtos/Machine'
import {
    cacheMachines,
    getCachedMachine,
    removeCachedMachine,
} from './machineCache'
import {
    createMachine,
    CreateMachineInput,
    deleteMachine,
    deleteMachinePhoto,
    getMachine,
    MachineSearchParams,
    searchMyMachines,
    updateMachine,
    UpdateMachineInput,
    uploadMachinePhoto,
} from './machines'
import { markWorkoutDataStale } from './workoutData'

function isLocalPhoto(photo?: string) {
    return !!photo && !/^https?:\/\//i.test(photo) && !photo.startsWith('data:')
}

export async function getCachedMachineData(machineId: string) {
    return getCachedMachine(machineId)
}

export async function loadMachineData(machineId: string) {
    const machine = await getMachine(machineId)
    await cacheMachines([machine])
    return machine
}

export async function searchMachineData(params: MachineSearchParams) {
    const response = await searchMyMachines(params)
    await cacheMachines(response.items)
    return response
}

export async function createCustomMachineData(input: CreateMachineInput) {
    const { photo, ...machineInput } = input
    const shouldUploadPhoto = isLocalPhoto(photo)
    let machine = await createMachine({
        ...machineInput,
        ...(!shouldUploadPhoto && photo ? { photo } : {}),
    })
    markWorkoutDataStale()

    if (shouldUploadPhoto && photo) {
        try {
            machine = await uploadMachinePhoto(machine.id, photo)
        } catch (error) {
            await deleteMachine(machine.id).catch(() => undefined)
            throw error
        }
    }

    markWorkoutDataStale()
    await cacheMachines([machine])
    return machine
}

export async function updateCustomMachineData(
    machineId: string,
    input: UpdateMachineInput,
) {
    const { photo, ...machineInput } = input
    const currentMachine = await getCachedMachine(machineId)
    const currentPhoto = currentMachine?.photo ?? ''
    const shouldUploadPhoto = isLocalPhoto(photo)
    let machine = await updateMachine(machineId, machineInput)
    markWorkoutDataStale()

    if (photo !== undefined && (photo !== currentPhoto || shouldUploadPhoto)) {
        if (!photo) {
            machine = await deleteMachinePhoto(machineId)
        } else if (shouldUploadPhoto) {
            machine = await uploadMachinePhoto(machineId, photo)
        } else {
            machine = await updateMachine(machineId, { photo })
        }
    }

    markWorkoutDataStale()
    await cacheMachines([machine])
    return machine
}

export async function deleteCustomMachineData(machineId: string) {
    await deleteMachine(machineId)
    markWorkoutDataStale()
    await removeCachedMachine(machineId)
}

export async function updateMachinePhotoData(
    machineId: string,
    photo?: string,
) {
    const machine = photo
        ? await uploadMachinePhoto(machineId, photo)
        : await deleteMachinePhoto(machineId)

    markWorkoutDataStale()
    await cacheMachines([machine])
    return machine
}

export async function cacheMachineData(machine: Machine) {
    await cacheMachines([machine])
}
