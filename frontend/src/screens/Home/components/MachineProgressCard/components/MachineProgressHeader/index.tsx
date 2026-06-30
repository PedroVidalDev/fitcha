import { CategoryBadge } from '@/src/components/CategoryBadge'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, View } from 'react-native'
import { formatDelta } from '../../../../helpers'
import { type MachineProgressHeaderProps } from './types'

export function MachineProgressHeader(props: MachineProgressHeaderProps) {
    const { item } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()
    const deltaColor =
        item.deltaFromStart === null
            ? t.textMuted
            : item.deltaFromStart >= 0
              ? t.accent
              : t.home.danger
    const comparisonText =
        item.deltaFromStart === null
            ? item.latestMetric === null
                ? translate('home.machine.comparison.noHistory')
                : translate('home.machine.comparison.needMore')
            : translate('home.machine.comparison.default')

    return (
        <>
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
                {formatDelta(item.deltaFromStart, item.metricKind, translate)}
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
        </>
    )
}
