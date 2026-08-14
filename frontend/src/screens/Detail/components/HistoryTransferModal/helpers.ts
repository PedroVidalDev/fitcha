import { CatalogMachine } from '@/src/dtos/CatalogMachine'
import { Machine } from '@/src/dtos/Machine'

export function isCompatible(
    source: Machine,
    target: Machine | CatalogMachine,
) {
    return (
        source.trackingType === target.trackingType &&
        source.requiresWeight === target.requiresWeight
    )
}
