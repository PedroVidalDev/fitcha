import { Ionicons } from '@expo/vector-icons'

export type PhotoModalProps = {
    photoModal: PhotoModalState | null
    closePhotoModal: () => void
}

export type PhotoModalAction = {
    label: string
    icon: keyof typeof Ionicons.glyphMap
    variant?: 'default' | 'accent' | 'danger'
    onPress: () => void
}

export type PhotoModalState = {
    title: string
    message?: string
    actions: PhotoModalAction[]
    closeLabel?: string
    hideCloseButton?: boolean
}
