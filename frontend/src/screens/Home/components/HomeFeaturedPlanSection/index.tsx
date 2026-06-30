import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { ScrollView, Text, View } from 'react-native'
import { getFeaturedPlanCopy } from '../../helpers'
import { DashboardPanel } from '../DashboardPanel'
import { MachineProgressCard } from '../MachineProgressCard'
import { type HomeFeaturedPlanSectionProps } from './types'

export function HomeFeaturedPlanSection(props: HomeFeaturedPlanSectionProps) {
    const { summary, progressCardWidth } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()
    const featuredPlanCopy = getFeaturedPlanCopy(
        summary.featuredPlanDay,
        translate,
    )

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
                {featuredPlanCopy.title}
            </Text>
            <Text
                style={{
                    color: t.textPrimary,
                    fontSize: 24,
                    fontWeight: '900',
                    marginTop: 8,
                }}
            >
                {summary.featuredPlanDay
                    ? translate('home.featured.focusCount', {
                          count: summary.machineProgress.length,
                          pluralSuffix:
                              summary.machineProgress.length !== 1 ? 's' : '',
                      })
                    : translate('home.featured.noPlannedDays')}
            </Text>
            <Text
                style={{
                    color: t.textMuted,
                    fontSize: 13,
                    lineHeight: 19,
                    marginTop: 6,
                }}
            >
                {featuredPlanCopy.subtitle}
            </Text>

            {summary.featuredPlanDay ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                        gap: 12,
                        paddingRight: 4,
                        marginTop: 18,
                    }}
                    snapToInterval={progressCardWidth + 12}
                    decelerationRate='fast'
                >
                    {summary.machineProgress.map((item) => (
                        <MachineProgressCard
                            key={item.machineId}
                            item={item}
                            width={progressCardWidth}
                        />
                    ))}
                </ScrollView>
            ) : (
                <View
                    style={{
                        backgroundColor: t.inputBg,
                        borderRadius: 18,
                        padding: 16,
                        marginTop: 18,
                        borderWidth: 0.5,
                        borderColor: t.border,
                    }}
                >
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 14,
                            lineHeight: 20,
                        }}
                    >
                        {translate('home.featured.emptyPanel')}
                    </Text>
                </View>
            )}
        </DashboardPanel>
    )
}
