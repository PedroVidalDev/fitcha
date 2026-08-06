import { AnimatedCard } from '@/src/components/AnimatedCard'
import { HoldToActionCard } from '@/src/components/HoldToActionCard'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { formatSetSequence } from '@/src/utils/workoutRecords'
import { Text, View } from 'react-native'
import { HistoryProps } from './types'

export const History = (props: HistoryProps) => {
    const { item, index, machine, isBusy = false, onRequestDelete } = props

    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <AnimatedCard key={item.id} index={index}>
            <HoldToActionCard
                disabled={isBusy}
                accessibilityLabel={translate(
                    'detail.history.deleteAccessibilityLabel',
                    { date: item.label },
                )}
                accessibilityHint={translate('detail.history.holdHint')}
                onComplete={() => onRequestDelete(item)}
            >
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
                        opacity: isBusy ? 0.55 : 1,
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
                        {formatSetSequence(item.sets, ' / ', machine)}
                    </Text>
                </View>
            </HoldToActionCard>
        </AnimatedCard>
    )
}
