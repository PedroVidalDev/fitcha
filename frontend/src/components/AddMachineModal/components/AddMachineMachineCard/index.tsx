import { MACHINE_CATEGORIES } from '@/src/constants/categories'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import { type AddMachineMachineCardProps } from './types'

export function AddMachineMachineCard(props: AddMachineMachineCardProps) {
    const { machine, isSelected, onPress } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <TouchableOpacity
            activeOpacity={0.78}
            onPress={onPress}
            style={{
                flexDirection: 'row',
                gap: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: isSelected ? t.accent : t.border,
                backgroundColor: isSelected ? t.chipBg : t.inputBg,
                padding: 12,
            }}
        >
            {machine.photo ? (
                <Image
                    source={{ uri: machine.photo }}
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 12,
                    }}
                    resizeMode='cover'
                />
            ) : (
                <View
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 12,
                        backgroundColor: t.card,
                        borderWidth: 0.5,
                        borderColor: t.border,
                    }}
                />
            )}

            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        color: t.textPrimary,
                        fontSize: 15,
                        fontWeight: '800',
                    }}
                >
                    {machine.name}
                </Text>
                <Text
                    style={{
                        color: isSelected ? t.accent : t.textDim,
                        fontSize: 12,
                        fontWeight: '700',
                        marginTop: 4,
                        textTransform: 'uppercase',
                    }}
                >
                    {translate(
                        MACHINE_CATEGORIES.find(
                            (item) => item.key === machine.categoryKey,
                        )?.labelKey ?? 'categories.peito',
                    )}
                </Text>
                {!!machine.description && (
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 12,
                            lineHeight: 18,
                            marginTop: 6,
                        }}
                        numberOfLines={2}
                    >
                        {machine.description}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    )
}
