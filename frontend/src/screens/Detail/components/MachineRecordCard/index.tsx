import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { formatDetailPrimaryMetric } from '@/src/screens/Detail/helpers'
import {
    formatSetSequence,
    getHistoryEntryPrimaryMetric,
    getHistoryMetricKind,
    getRecordHistoryEntry,
} from '@/src/utils/workoutRecords'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, View } from 'react-native'
import { MachineRecordCardProps } from './types'

export function MachineRecordCard(props: MachineRecordCardProps) {
    const { machine, history, width } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    const recordEntry = getRecordHistoryEntry(history, machine)
    const recordMetricKind = getHistoryMetricKind(
        machine,
        recordEntry?.sets ?? [],
    )
    const recordMetric = recordEntry
        ? getHistoryEntryPrimaryMetric(recordEntry, machine)
        : null
    const recordOverlayColor =
        t.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.44)'
    const recordStripeColors =
        t.mode === 'dark'
            ? (['rgba(255,208,112,0.16)', 'rgba(244,162,97,0.06)'] as const)
            : (['rgba(244,162,97,0.16)', 'rgba(255,208,112,0.18)'] as const)
    const recordSequenceColor = t.mode === 'dark' ? '#FFF4E6' : t.textPrimary
    const recordDateColor = t.mode === 'dark' ? '#D9A57A' : t.textMuted

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
            <View
                pointerEvents='none'
                style={{
                    position: 'absolute',
                    top: -28,
                    right: -18,
                    width: 104,
                    height: 104,
                    borderRadius: 999,
                    backgroundColor: recordOverlayColor,
                }}
            />
            <View
                pointerEvents='none'
                style={{
                    position: 'absolute',
                    bottom: -30,
                    left: -26,
                    width: 78,
                    height: 78,
                    borderRadius: 999,
                    backgroundColor: recordOverlayColor,
                }}
            />
            <LinearGradient
                colors={t.gradientAccent}
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
                                name='trophy'
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
                            {translate('detail.record.title')}
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
                        {recordEntry
                            ? translate('detail.record.subtitle')
                            : translate('detail.record.empty')}
                    </Text>
                </View>

                {recordMetric !== null && (
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
                            {formatDetailPrimaryMetric(
                                recordMetric,
                                recordMetricKind,
                                translate,
                            )}
                        </Text>
                    </View>
                )}
            </View>

            {recordEntry && (
                <LinearGradient
                    colors={recordStripeColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        marginTop: 12,
                        borderRadius: 14,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderWidth: 1,
                        borderColor: t.border,
                    }}
                >
                    <View style={{ gap: 8 }}>
                        {recordEntry.sets.map((set, index) => (
                            <View
                                key={`${recordEntry.id}-${index}`}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 10,
                                    borderRadius: 10,
                                    paddingHorizontal: 10,
                                    paddingVertical: 9,
                                    backgroundColor:
                                        t.mode === 'dark'
                                            ? 'rgba(255,255,255,0.05)'
                                            : 'rgba(255,255,255,0.56)',
                                    borderWidth: 1,
                                    borderColor: t.border,
                                }}
                            >
                                <View
                                    style={{
                                        minWidth: 24,
                                        height: 24,
                                        borderRadius: 999,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: t.chipBg,
                                        borderWidth: 1,
                                        borderColor: t.border,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: t.accent,
                                            fontSize: 11,
                                            fontWeight: '800',
                                        }}
                                    >
                                        {index + 1}
                                    </Text>
                                </View>
                                <Text
                                    numberOfLines={1}
                                    style={{
                                        flex: 1,
                                        color: recordSequenceColor,
                                        fontSize: 17,
                                        fontWeight: '900',
                                    }}
                                >
                                    {formatSetSequence([set], '', machine)}
                                </Text>
                            </View>
                        ))}
                    </View>
                    <Text
                        style={{
                            color: recordDateColor,
                            fontSize: 12,
                            marginTop: 8,
                        }}
                    >
                        {recordEntry.label}
                    </Text>
                </LinearGradient>
            )}
        </LinearGradient>
    )
}
