import { useI18n } from '@/src/contexts/I18nContext'
import { View } from 'react-native'
import { StatCard } from '../StatCard'
import { type HomeStatsSectionProps } from './types'

export function HomeStatsSection(props: HomeStatsSectionProps) {
    const { summary, variant = 'primary' } = props
    const { t: translate } = useI18n()

    if (variant === 'secondary') {
        return (
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <StatCard
                    index={1}
                    title={translate('home.stats.monthTitle')}
                    value={`${summary.monthlyWorkoutDays}`}
                    hint={translate('home.stats.monthHint')}
                    icon='barbell-outline'
                />
                <StatCard
                    index={2}
                    title={translate('home.stats.weekTitle')}
                    value={`${summary.scheduledDayCount}`}
                    hint={translate('home.stats.weekHint', {
                        count: summary.totalMachinesScheduled,
                        pluralSuffix:
                            summary.totalMachinesScheduled !== 1 ? 's' : '',
                    })}
                    icon='calendar-clear-outline'
                />
            </View>
        )
    }

    return (
        <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatCard
                index={0}
                title={translate('home.stats.streakTitle')}
                value={`${summary.streak}`}
                hint={translate('home.stats.streakHint', {
                    suffix:
                        summary.streak === 0
                            ? translate('home.stats.streakHintZero')
                            : '',
                })}
                icon='flame-outline'
            />
            <StatCard
                index={1}
                title={translate('home.stats.last7Title')}
                value={`${summary.recentWorkoutDays}/7`}
                hint={translate('home.stats.last7Hint')}
                icon='pulse-outline'
            />
        </View>
    )
}
