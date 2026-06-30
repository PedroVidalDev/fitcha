import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, View } from 'react-native'
import { DashboardPanel } from '../DashboardPanel'
import { type HomeRhythmSectionProps } from './types'

export function HomeRhythmSection(props: HomeRhythmSectionProps) {
    const { summary } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <DashboardPanel>
            <Text
                style={{
                    color: t.textDim,
                    fontSize: 11,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                }}
            >
                {translate('home.rhythm.kicker')}
            </Text>
            <Text
                style={{
                    color: t.textPrimary,
                    fontSize: 24,
                    fontWeight: '900',
                    marginTop: 8,
                }}
            >
                {summary.scheduledDayCount > 0
                    ? translate('home.rhythm.titleWithCount', {
                          count: summary.scheduledDayCount,
                          daySuffix: summary.scheduledDayCount > 1 ? 's' : '',
                          builtSuffix: summary.scheduledDayCount > 1 ? 's' : '',
                      })
                    : translate('home.rhythm.titleEmpty')}
            </Text>
            <Text
                style={{
                    color: t.textMuted,
                    fontSize: 13,
                    lineHeight: 19,
                    marginTop: 6,
                }}
            >
                {summary.nextPlannedDayLabel
                    ? translate('home.rhythm.subtitleWithNext', {
                          next: summary.nextPlannedDayLabel,
                      })
                    : translate('home.rhythm.subtitleEmpty')}
            </Text>

            <View
                style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 10,
                    marginTop: 18,
                }}
            >
                {summary.weekPlan.map((day) => {
                    const isActive = day.machineCount > 0

                    return (
                        <View
                            key={day.dayIndex}
                            style={{
                                width: '22%',
                                minWidth: 68,
                                backgroundColor: day.isToday
                                    ? t.chipBg
                                    : t.inputBg,
                                borderRadius: 18,
                                paddingVertical: 12,
                                paddingHorizontal: 10,
                                borderWidth: 0.5,
                                borderColor: day.isToday ? t.accent : t.border,
                                opacity: isActive ? 1 : 0.72,
                            }}
                        >
                            <Text
                                style={{
                                    color: day.isToday ? t.accent : t.textDim,
                                    fontSize: 11,
                                    fontWeight: '800',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1.2,
                                }}
                            >
                                {day.shortLabel}
                            </Text>
                            <Text
                                style={{
                                    color: isActive
                                        ? t.textPrimary
                                        : t.textMuted,
                                    fontSize: 20,
                                    fontWeight: '900',
                                    marginTop: 8,
                                }}
                            >
                                {day.machineCount}
                            </Text>
                            <Text
                                style={{
                                    color: t.textMuted,
                                    fontSize: 11,
                                    marginTop: 2,
                                }}
                            >
                                {translate('week.machineCount', {
                                    count: day.machineCount,
                                    pluralSuffix:
                                        day.machineCount !== 1 ? 's' : '',
                                })}
                            </Text>
                        </View>
                    )
                })}
            </View>
        </DashboardPanel>
    )
}
