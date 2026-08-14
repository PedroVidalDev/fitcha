import { CatalogMachine } from '@/src/dtos/CatalogMachine'
import { AddMachineOption } from './types'
import { Machine } from '@/src/dtos/Machine'

export function toCatalogOption(machine: CatalogMachine): AddMachineOption {
    return {
        key: `catalog:${machine.id}`,
        kind: 'catalog',
        id: machine.id,
        name: machine.name,
        description: machine.description,
        photo: machine.photo,
        categoryKey: machine.categoryKey,
        substitutionGroup: machine.substitutionGroup,
        trackingType: machine.trackingType,
        requiresWeight: machine.requiresWeight,
        searchTerms: [machine.name, machine.slug, ...(machine.aliases ?? [])],
    }
}

export function toCustomOption(machine: Machine): AddMachineOption {
    return {
        key: `custom:${machine.id}`,
        kind: 'custom',
        id: machine.id,
        name: machine.name,
        description: machine.description,
        photo: machine.photo,
        categoryKey: machine.categoryKey,
        trackingType: machine.trackingType,
        requiresWeight: machine.requiresWeight,
        searchTerms: [machine.name, machine.description ?? ''],
    }
}
