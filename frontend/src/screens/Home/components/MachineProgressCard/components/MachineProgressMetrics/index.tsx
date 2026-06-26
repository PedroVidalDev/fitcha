import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, View } from 'react-native'
import { formatRecord, formatWeight } from '../../../../helpers'
import { type MachineProgressMetricsProps } from './types'

export function MachineProgressMetrics(props: MachineProgressMetricsProps) {
    const { item } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()
    const currentBackground = t.home.background[0]
    const currentBorder = t.home.border[0]
    const initialBackground = t.home.background[1] ?? t.home.background[0]
    const initialBorder = t.home.border[1] ?? t.home.border[0]
    const recordPalette = t.home.record

    return (
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
    )
}
