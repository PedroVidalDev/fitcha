export type WorkoutFormModalProps = {
    visible: boolean
    title: string
    initialName?: string
    initialDescription?: string
    submitLabel: string
    onClose: () => void
    onSubmit: (name: string, description: string) => Promise<void> | void
}
