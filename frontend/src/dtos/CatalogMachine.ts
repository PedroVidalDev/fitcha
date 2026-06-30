import { MachineCategoryKey } from '../constants/categories'

export type CatalogMachine = {
    id: string
    slug: string
    name: string
    description?: string
    photo?: string
    categoryKey: MachineCategoryKey
    aliases: string[]
}
