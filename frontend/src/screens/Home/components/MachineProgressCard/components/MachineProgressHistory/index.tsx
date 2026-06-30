import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, View } from 'react-native'
import { type MachineProgressHistoryProps } from './types'

export function MachineProgressHistory(props: MachineProgressHistoryProps) {
    const { item } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()
    const chartMax = Math.max(...item.points.map((point) => point.maxWeight), 1)
    const previousDeltaText =
        item.deltaFromPrevious === null
            ? item.sessionCount === 0
                ? translate('home.machine.previous.noHistory')
                : item.sessionCount === 1
                  ? translate('home.machine.previous.oneRecord')
                  : translate('home.machine.previous.noComparison')
            : translate('home.machine.previous.vsLast', {
                  value: `${item.deltaFromPrevious > 0 ? '+' : ''}${item.deltaFromPrevious} kg`,
              })

    return (
        <>
            {item.points.length === 0 ? (
                <View
                    style={{
                        backgroundColor: t.card,
                        borderRadius: 16,
                        padding: 16,
                        marginTop: 18,
                    }}
                >
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 13,
                            lineHeight: 18,
                        }}
                    >
                        {translate('home.machine.noHistoryCard')}
                    </Text>
                </View>
            ) : (
                <View style={{ marginTop: 18 }}>
                    <Text
                        style={{
                            color: t.textDim,
                            fontSize: 10,
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: 1.2,
                            marginBottom: 10,
                        }}
                    >
                        {translate('home.machine.recordsTitle')}
                    </Text>

                    <View
                        style={{
                            height: 118,
                            flexDirection: 'row',
                            alignItems: 'flex-end',
                            gap: 8,
                        }}
                    >
                        {item.points.map((point, index) => {
                            const height = Math.max(
                                24,
                                Math.round((point.maxWeight / chartMax) * 62),
                            )
                            const isLatest = index === item.points.length - 1
                            const chartColors = isLatest
                                ? t.home.chart.latest
                                : t.home.chart.palette[
                                      index % t.home.chart.palette.length
                                  ]

                            return (
                                <View
                                    key={point.key}
                                    style={{
                                        flex: 1,
                                        alignItems: 'center',
                                        justifyContent: 'flex-end',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: isLatest
                                                ? t.accent
                                                : t.textDim,
                                            fontSize: 10,
                                            fontWeight: '800',
                                            marginBottom: 6,
                                        }}
                                    >
                                        {point.maxWeight}
                                    </Text>
                                    <LinearGradient
                                        colors={chartColors}
                                        start={{ x: 0, y: 1 }}
                                        end={{ x: 0, y: 0 }}
                                        style={{
                                            width: '100%',
                                            height,
                                            borderRadius: 14,
                                            opacity: isLatest ? 1 : 0.7,
                                        }}
                                    />
                                    <Text
                                        style={{
                                            color: isLatest
                                                ? t.textPrimary
                                                : t.textMuted,
                                            fontSize: 10,
                                            fontWeight: '700',
                                            marginTop: 8,
                                        }}
                                    >
                                        {point.label}
                                    </Text>
                                </View>
                            )
                        })}
                    </View>
                </View>
            )}

            <Text
                style={{
                    color: t.textMuted,
                    fontSize: 12,
                    lineHeight: 18,
                    marginTop: 14,
                }}
            >
                {previousDeltaText}
            </Text>
        </>
    )
}
