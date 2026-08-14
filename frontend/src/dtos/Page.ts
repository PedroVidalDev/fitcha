export type PageResponse<T> = {
    items: T[]
    page: number
    limit: number
    total: number
    totalPages: number
}
