import { AnimatedCard } from '@/src/components/AnimatedCard'
import { CategoryBadge } from '@/src/components/CategoryBadge'
import { GradientCard } from '@/src/components/GradientCard'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { Image, Text, View } from 'react-native'
import { type DayMachineCardProps } from './types'

export function DayMachineCard(props: DayMachineCardProps) {
    const { item, index, onPress, onLongPress } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <AnimatedCard index={index}>
            <GradientCard onPress={onPress} onLongPress={onLongPress}>
                {item.photo ? (
                    <Image
                        source={{ uri: item.photo }}
                        style={{
                            width: 50,
                            height: 50,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: t.border,
                        }}
                        resizeMode='cover'
                    />
                ) : (
                    <View
                        style={{
                            width: 50,
                            height: 50,
                            borderRadius: 12,
                            backgroundColor: t.chipBg,
                            borderWidth: 1,
                            borderColor: t.border,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Ionicons
                            name='barbell-outline'
                            size={22}
                            color={t.accent}
                        />
                    </View>
                )}

                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            color: t.textPrimary,
                            fontSize: 16,
                            fontWeight: '700',
                        }}
                    >
                        {item.name}
                    </Text>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            marginTop: 4,
                        }}
                    >
                        <CategoryBadge categoryKey={item.categoryKey} />
                        {item.lastWeight && (
                            <Text
                                style={{
                                    color: t.accent,
                                    fontSize: 12,
                                    fontWeight: '700',
                                }}
                            >
                                {translate('day.maxWeight', {
                                    weight: item.lastWeight,
                                })}
                            </Text>
                        )}
                    </View>
                    {item.description && (
                        <Text
                            style={{
                                color: t.textDim,
                                fontSize: 12,
                                marginTop: 4,
                            }}
                            numberOfLines={1}
                        >
                            {item.description}
                        </Text>
                    )}
                </View>
                <Ionicons
                    name='chevron-forward'
                    size={18}
                    color={t.textMuted}
                />
            </GradientCard>
        </AnimatedCard>
    )
}
