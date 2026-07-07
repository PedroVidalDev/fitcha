import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import {
    formatDetailPrimaryMetric,
    getDetailProgressMetricLabel,
} from '@/src/screens/Detail/helpers'
import {
    formatSetSequence,
    getHistoryEntryPrimaryMetric,
    getHistoryMetricKind,
} from '@/src/utils/workoutRecords'
import { Ionicons } from '@expo/vector-icons'
import { Line as SkiaLine } from '@shopify/react-native-skia'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useState } from 'react'
import { Text, View } from 'react-native'
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated'
import {
    Area,
    CartesianChart,
    Line,
    Scatter,
    useChartPressState,
} from 'victory-native'
import { ProgressChartCardProps, ProgressDatum } from './types'
import { CHART_HEIGHT } from './consts'

export function ProgressChartCard(props: ProgressChartCardProps) {
    const { history, machine, width } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()
    const chartWidth = Math.max(width - 32, 220)
    const { state: chartPressState } = useChartPressState({
        x: 0,
        y: { value: 0 },
    })

    const sortedHistory = useMemo(
        () =>
            [...history].sort(
                (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime(),
            ),
        [history],
    )
    const metricKind = getHistoryMetricKind(
        machine,
        sortedHistory[sortedHistory.length - 1]?.sets ?? [],
    )
    const chartData = useMemo<ProgressDatum[]>(
        () =>
            sortedHistory.map((entry, index) => {
                const metricValue = getHistoryEntryPrimaryMetric(entry, machine)

                return {
                    id: entry.id,
                    index,
                    label: entry.label,
                    value: metricValue,
                    sequence: formatSetSequence(entry.sets, ' / ', machine),
                    metricText: formatDetailPrimaryMetric(
                        metricValue,
                        metricKind,
                        translate,
                    ),
                }
            }),
        [machine, metricKind, sortedHistory, translate],
    )
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

    useEffect(() => {
        setSelectedIndex(chartData.length > 0 ? chartData.length - 1 : null)
    }, [chartData.length])

    useAnimatedReaction(
        () => chartPressState.matchedIndex.value,
        (nextIndex, previousIndex) => {
            if (nextIndex < 0 || nextIndex === previousIndex) return
            runOnJS(setSelectedIndex)(nextIndex)
        },
        [chartPressState],
    )

    const selectedEntry =
        selectedIndex !== null ? (chartData[selectedIndex] ?? null) : null
    const firstEntry = chartData[0] ?? null
    const latestEntry = chartData[chartData.length - 1] ?? null

    return (
        <LinearGradient
            colors={t.gradientCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
                width,
                borderRadius: 16,
                padding: 14,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: t.border,
            }}
        >
            <LinearGradient
                colors={t.home.chart.latest}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                }}
            />

            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                }}
            >
                <View style={{ flex: 1 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <View
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 10,
                                backgroundColor: t.chipBg,
                                borderWidth: 1,
                                borderColor: t.border,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Ionicons
                                name='trending-up-outline'
                                size={16}
                                color={t.accent}
                            />
                        </View>
                        <Text
                            style={{
                                color: t.textPrimary,
                                fontSize: 11,
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: 2,
                            }}
                        >
                            {translate('detail.progress.title')}
                        </Text>
                    </View>
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 12,
                            lineHeight: 17,
                            marginTop: 6,
                        }}
                    >
                        {translate('detail.progress.subtitle')}
                    </Text>
                </View>

                <View
                    style={{
                        backgroundColor: t.chipBg,
                        borderRadius: 999,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderWidth: 1,
                        borderColor: t.border,
                    }}
                >
                    <Text
                        style={{
                            color: t.accent,
                            fontSize: 12,
                            fontWeight: '800',
                        }}
                    >
                        {getDetailProgressMetricLabel(metricKind, translate)}
                    </Text>
                </View>
            </View>

            {chartData.length === 0 ? (
                <Text
                    style={{
                        color: t.textDim,
                        fontSize: 12,
                        lineHeight: 17,
                        marginTop: 14,
                    }}
                >
                    {translate('detail.progress.empty')}
                </Text>
            ) : (
                <>
                    {selectedEntry && (
                        <View
                            style={{
                                marginTop: 12,
                                borderRadius: 12,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                backgroundColor: t.home.background[0],
                                borderWidth: 1,
                                borderColor: t.home.border[0],
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 12,
                                }}
                            >
                                <Text
                                    style={{
                                        flex: 1,
                                        color: t.textPrimary,
                                        fontSize: 12,
                                        fontWeight: '800',
                                    }}
                                >
                                    {selectedEntry.label}
                                </Text>
                                <Text
                                    style={{
                                        color: t.accent,
                                        fontSize: 12,
                                        fontWeight: '800',
                                    }}
                                >
                                    {selectedEntry.metricText}
                                </Text>
                            </View>
                            <Text
                                numberOfLines={1}
                                style={{
                                    color: t.textMuted,
                                    fontSize: 12,
                                    lineHeight: 16,
                                    marginTop: 4,
                                }}
                            >
                                {selectedEntry.sequence}
                            </Text>
                        </View>
                    )}

                    <View
                        style={{
                            marginTop: 12,
                            alignSelf: 'center',
                        }}
                    >
                        <CartesianChart
                            data={chartData}
                            xKey='index'
                            yKeys={['value']}
                            chartPressState={chartPressState}
                            explicitSize={{
                                width: chartWidth,
                                height: CHART_HEIGHT,
                            }}
                            padding={{
                                left: 12,
                                right: 12,
                                top: 18,
                                bottom: 18,
                            }}
                            domainPadding={{ left: 18, right: 18, top: 24 }}
                            xAxis={{
                                lineWidth: 0,
                            }}
                            yAxis={[
                                {
                                    lineColor: t.border,
                                    lineWidth: 1,
                                    tickCount: 3,
                                },
                            ]}
                            frame={{ lineWidth: 0 }}
                        >
                            {({ points, chartBounds }) => {
                                const activePoint = selectedEntry
                                    ? points.value.find(
                                          (point) =>
                                              point.xValue ===
                                              selectedEntry.index,
                                      )
                                    : undefined
                                const activePoints = activePoint
                                    ? [activePoint]
                                    : []

                                return (
                                    <>
                                        <Area
                                            points={points.value}
                                            y0={chartBounds.bottom}
                                            color={t.accent}
                                            opacity={0.14}
                                            curveType='monotoneX'
                                        />
                                        <Line
                                            points={points.value}
                                            color={t.accent}
                                            strokeWidth={3}
                                            curveType='monotoneX'
                                        />
                                        <Scatter
                                            points={points.value}
                                            color={t.textMuted}
                                            opacity={0.28}
                                            radius={2.5}
                                        />
                                        {activePoint ? (
                                            <SkiaLine
                                                p1={{
                                                    x: activePoint.x,
                                                    y: chartBounds.top + 4,
                                                }}
                                                p2={{
                                                    x: activePoint.x,
                                                    y: chartBounds.bottom,
                                                }}
                                                color={t.home.chart.latest[1]}
                                                opacity={0.2}
                                                strokeWidth={1.5}
                                            />
                                        ) : null}
                                        <Scatter
                                            points={activePoints}
                                            color={t.home.chart.latest[1]}
                                            opacity={0.22}
                                            radius={10}
                                        />
                                        <Scatter
                                            points={activePoints}
                                            color={t.home.chart.latest[1]}
                                            radius={6}
                                        />
                                    </>
                                )
                            }}
                        </CartesianChart>
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            gap: 12,
                            marginTop: 8,
                        }}
                    >
                        <Text
                            numberOfLines={1}
                            style={{
                                flex: 1,
                                color: t.textMuted,
                                fontSize: 10,
                                fontWeight: '600',
                            }}
                        >
                            {firstEntry?.label}
                        </Text>
                        <Text
                            numberOfLines={1}
                            style={{
                                flex: 1,
                                color: t.textPrimary,
                                fontSize: 10,
                                fontWeight: '700',
                                textAlign: 'right',
                            }}
                        >
                            {latestEntry?.label}
                        </Text>
                    </View>
                </>
            )}
        </LinearGradient>
    )
}
