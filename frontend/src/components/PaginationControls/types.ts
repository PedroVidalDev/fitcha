export type PaginationControlsProps = {
    page: number
    totalPages: number
    disabled?: boolean
    onChangePage: (page: number) => void
}
