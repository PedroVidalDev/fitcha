import { AnimatedCard } from '@/src/components/AnimatedCard'
import { useTheme } from '@/src/contexts/ThemeContext'
import { formatSetSequence } from '@/src/utils/workoutRecords'
import { Text, View } from 'react-native'
import { HistoryProps } from './types'

export const History = (props: HistoryProps) => {
    const { item, index } = props

    const { t } = useTheme()

    return (
        <AnimatedCard key={item.id} index={index}>
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: t.histBg,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderWidth: 0.5,
                    borderColor: t.border,
                }}
            >
                <Text
                    style={{
                        color: t.textMuted,
                        fontSize: 13,
                        fontWeight: '500',
                    }}
                >
                    {item.label}
                </Text>
                <Text
                    style={{
                        color: t.accent,
                        fontSize: 14,
                        fontWeight: '700',
                    }}
                >
                    {formatSetSequence(item.sets, ' / ')}
                </Text>
            </View>
        </AnimatedCard>
    )
}
