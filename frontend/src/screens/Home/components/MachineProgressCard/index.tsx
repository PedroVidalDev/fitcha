import { CategoryBadge } from '@/src/components/CategoryBadge'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { DashboardMachineProgress } from '@/src/hooks/useDashboardSummary'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, View } from 'react-native'
import { formatDelta, formatRecord, formatWeight } from '../../helpers'

export function MachineProgressCard(props: {
    item: DashboardMachineProgress
    width: number
}) {
    const { item, width } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()
    const currentBackground = t.home.background[0]
    const currentBorder = t.home.border[0]
    const initialBackground = t.home.background[1] ?? t.home.background[0]
    const initialBorder = t.home.border[1] ?? t.home.border[0]
    const recordPalette = t.home.record

    const chartMax = Math.max(...item.points.map((point) => point.maxWeight), 1)
    const deltaColor =
        item.deltaFromStart === null
            ? t.textMuted
            : item.deltaFromStart >= 0
              ? t.accent
              : t.home.danger
    const comparisonText =
        item.deltaFromStart === null
            ? item.latestWeight === null
                ? translate('home.machine.comparison.noHistory')
                : translate('home.machine.comparison.needMore')
            : translate('home.machine.comparison.default')
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
        <View
            style={{
                width,
                backgroundColor: t.inputBg,
                borderRadius: 20,
                padding: 16,
                borderWidth: 0.5,
                borderColor: t.border,
            }}
        >
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                }}
            >
                <CategoryBadge categoryKey={item.categoryKey} />

                <View
                    style={{
                        backgroundColor: t.chipBg,
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                    }}
                >
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 11,
                            fontWeight: '700',
                        }}
                    >
                        {item.lastTrainedLabel
                            ? translate('home.machine.lastTrained', {
                                  label: item.lastTrainedLabel,
                              })
                            : translate('home.machine.noTraining')}
                    </Text>
                </View>
            </View>

            <Text
                style={{
                    color: t.textPrimary,
                    fontSize: 22,
                    fontWeight: '900',
                    marginTop: 14,
                }}
            >
                {item.name}
            </Text>

            <Text
                style={{
                    color: deltaColor,
                    fontSize: 28,
                    fontWeight: '900',
                    marginTop: 14,
                }}
            >
                {formatDelta(item.deltaFromStart, translate)}
            </Text>

            <Text
                style={{
                    color: t.textMuted,
                    fontSize: 13,
                    lineHeight: 18,
                    marginTop: 6,
                }}
            >
                {comparisonText}
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: currentBackground,
                        borderRadius: 16,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: currentBorder,
                    }}
                >
                    <Text
                        style={{
                            color: t.textDim,
                            fontSize: 10,
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: 1.2,
                        }}
                    >
                        {translate('home.machine.metric.current')}
                    </Text>
                    <Text
                        style={{
                            color: t.textPrimary,
                            fontSize: 18,
                            fontWeight: '900',
                            marginTop: 6,
                        }}
                    >
                        {formatWeight(item.latestWeight)}
                    </Text>
                </View>

                <View
                    style={{
                        flex: 1,
                        backgroundColor: initialBackground,
                        borderRadius: 16,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: initialBorder,
                    }}
                >
                    <Text
                        style={{
                            color: t.textDim,
                            fontSize: 10,
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: 1.2,
                        }}
                    >
                        {translate('home.machine.metric.initial')}
                    </Text>
                    <Text
                        style={{
                            color: t.textPrimary,
                            fontSize: 18,
                            fontWeight: '900',
                            marginTop: 6,
                        }}
                    >
                        {formatWeight(item.firstWeight)}
                    </Text>
                </View>

                <View
                    style={{
                        flex: 1,
                        backgroundColor: recordPalette.cardBg,
                        borderRadius: 16,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: recordPalette.cardBorder,
                        overflow: 'hidden',
                    }}
                >
                    <Text
                        style={{
                            color: t.textDim,
                            fontSize: 10,
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: 1.2,
                        }}
                    >
                        {translate('home.machine.metric.record')}
                    </Text>
                    <Text
                        style={{
                            color: recordPalette.sequence,
                            fontSize: 17,
                            fontWeight: '900',
                            marginTop: 6,
                        }}
                    >
                        {formatRecord(item.bestRecordSets)}
                    </Text>
                    <Text
                        style={{
                            color: recordPalette.volume,
                            fontSize: 12,
                            lineHeight: 17,
                            marginTop: 4,
                            fontWeight: '700',
                        }}
                    >
                        {item.bestVolume === null
                            ? translate('home.machine.previous.noHistory')
                            : translate('home.machine.recordVolume', {
                                  volume: `${item.bestVolume}`,
                              })}
                    </Text>
                    <View
                        style={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            width: 44,
                            height: 44,
                            borderRadius: 999,
                            backgroundColor: recordPalette.cardGlow,
                        }}
                    />
                </View>
            </View>

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
        </View>
    )
}
