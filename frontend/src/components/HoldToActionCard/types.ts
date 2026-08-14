import { ReactNode } from 'react'
import { StyleProp, ViewStyle } from 'react-native'

export type HoldToActionCardProps = {
    children: ReactNode
    onComplete: () => void
    disabled?: boolean
    durationMs?: number
    borderRadius?: number
    accessibilityLabel?: string
    accessibilityHint?: string
    style?: StyleProp<ViewStyle>
}
