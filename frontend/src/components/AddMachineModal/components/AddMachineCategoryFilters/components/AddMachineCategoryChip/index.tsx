import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, TouchableOpacity } from 'react-native'
import { type AddMachineCategoryChipProps } from './types'

export function AddMachineCategoryChip(props: AddMachineCategoryChipProps) {
    const { label, active, activeColor, onPress } = props
    const { t } = useTheme()

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: active ? activeColor : t.inputBg,
                borderWidth: 0.5,
                borderColor: active ? activeColor : t.border,
            }}
        >
            <Text
                style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: active ? t.btnColor : t.textMuted,
                }}
            >
                {label}
            </Text>
        </TouchableOpacity>
    )
}
