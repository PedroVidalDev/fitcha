import { Ionicons } from '@expo/vector-icons'

export type StatCardProps = {
    index: number
    title: string
    value: string
    hint: string
    icon: keyof typeof Ionicons.glyphMap
}
