import { CategoryBadge } from '@/src/components/CategoryBadge'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { useMemo } from 'react'
import { FlatList, Text, View } from 'react-native'
import { type DayMachineListProps } from './types'
import { DayMachineCard } from '../DayMachineCard'

export function DayMachineList(props: DayMachineListProps) {
    const { machines, onPressMachine, onLongPressMachine } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()
    const categories = useMemo(
        () => [...new Set(machines.map((machine) => machine.categoryKey))],
        [machines],
    )

    return (
        <FlatList
            data={machines}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 12, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
                categories.length > 0 ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 8,
                            marginBottom: 14,
                        }}
                    >
                        {categories.map((categoryKey) => (
                            <CategoryBadge
                                key={categoryKey}
                                categoryKey={categoryKey}
                            />
                        ))}
                    </View>
                ) : null
            }
            ListEmptyComponent={
                <View
                    style={{
                        backgroundColor: t.inputBg,
                        borderRadius: 18,
                        borderWidth: 0.5,
                        borderColor: t.border,
                        padding: 18,
                    }}
                >
                    <Text
                        style={{
                            color: t.textPrimary,
                            fontSize: 16,
                            fontWeight: '800',
                        }}
                    >
                        {translate('day.emptyMachines')}
                    </Text>
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 13,
                            lineHeight: 19,
                            marginTop: 6,
                        }}
                    >
                        {translate('day.emptyMachinesHint')}
                    </Text>
                </View>
            }
            renderItem={({ item, index }) => (
                <DayMachineCard
                    item={item}
                    index={index}
                    onPress={() => onPressMachine(item.id)}
                    onLongPress={() => onLongPressMachine(item)}
                />
            )}
        />
    )
}
