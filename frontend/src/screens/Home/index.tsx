import { useDashboardSummary } from '@/src/hooks/useDashboardSummary'
import { RootStackParamList } from '@/src/router/types'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useState } from 'react'
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native'
import { AnimatedCard } from '../../components/AnimatedCard'
import { ConfirmModal } from '../../components/ConfirmModal'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'
import { useTheme } from '../../contexts/ThemeContext'
import {
    ActiveWorkoutSession,
    clearActiveWorkoutSession,
    getActiveWorkoutSession,
} from '../../services/activeWorkout'
import { DashboardPanel } from './components/DashboardPanel'
import { MachineProgressCard } from './components/MachineProgressCard'
import { StatCard } from './components/StatCard'
import { getFeaturedPlanCopy, getFirstName } from './helpers'

type Navigation = NativeStackNavigationProp<RootStackParamList, 'Home'>

export default function HomeScreen() {
    const { t } = useTheme()
    const { t: translate } = useI18n()
    const { user } = useAuth()
    const navigation = useNavigation<Navigation>()
    const { width } = useWindowDimensions()
    const { summary, isLoading, refresh } = useDashboardSummary()
    const [activeWorkoutSession, setActiveWorkoutSession] =
        useState<ActiveWorkoutSession | null>(null)

    useFocusEffect(
        useCallback(() => {
            let isActive = true

            void refresh()
            void (async () => {
                const session = await getActiveWorkoutSession()

                if (!isActive) return
                setActiveWorkoutSession(session)
            })()

            return () => {
                isActive = false
            }
        }, [refresh]),
    )

    if (isLoading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: t.bg,
                }}
            >
                <ActivityIndicator size='large' color={t.accent} />
            </View>
        )
    }

    const btnColor = t.home.buttonText
    const firstName = getFirstName(
        user?.name,
        translate('home.greetingFallback'),
    )
    const featuredPlanCopy = getFeaturedPlanCopy(
        summary.featuredPlanDay,
        translate,
    )
    const progressCardWidth = Math.min(Math.max(width - 84, 272), 332)

    return (
        <>
            <ScrollView
                style={{ flex: 1, backgroundColor: t.bg }}
                contentContainerStyle={{
                    padding: 16,
                    paddingBottom: 36,
                    gap: 14,
                }}
                showsVerticalScrollIndicator={false}
            >
                <AnimatedCard index={0}>
                    <View
                        style={{
                            borderRadius: 24,
                            overflow: 'hidden',
                            ...Platform.select({
                                ios: {
                                    shadowColor: t.shadow,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 14,
                                },
                                android: { elevation: 6 },
                            }),
                        }}
                    >
                        <LinearGradient
                            colors={t.gradientHero}
                            style={{
                                padding: 20,
                                borderRadius: 24,
                                borderWidth: 0.5,
                                borderColor: t.border,
                            }}
                        >
                            <Text
                                style={{
                                    color: t.textDim,
                                    fontSize: 11,
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: 2,
                                }}
                            >
                                {translate('home.header.kicker')}
                            </Text>
                            <Text
                                style={{
                                    color: t.textPrimary,
                                    fontSize: 28,
                                    fontWeight: '900',
                                    marginTop: 8,
                                }}
                            >
                                {translate('home.header.greeting', {
                                    name: firstName,
                                })}
                            </Text>
                            <Text
                                style={{
                                    color: t.textMuted,
                                    fontSize: 14,
                                    lineHeight: 21,
                                    marginTop: 10,
                                }}
                            >
                                {summary.hasHistory
                                    ? translate(
                                          'home.header.summaryWithHistory',
                                          {
                                              streak: summary.streak,
                                              streakSuffix:
                                                  summary.streak !== 1
                                                      ? 's'
                                                      : '',
                                              recent: summary.recentWorkoutDays,
                                              recentSuffix:
                                                  summary.recentWorkoutDays !==
                                                  1
                                                      ? 's'
                                                      : '',
                                              activeSuffix:
                                                  summary.recentWorkoutDays !==
                                                  1
                                                      ? 's'
                                                      : '',
                                          },
                                      )
                                    : translate(
                                          'home.header.summaryWithoutHistory',
                                      )}
                            </Text>

                            <View
                                style={{
                                    flexDirection: 'row',
                                    gap: 12,
                                    marginTop: 20,
                                }}
                            >
                                <View
                                    style={{
                                        flex: 1,
                                        backgroundColor: t.inputBg,
                                        borderRadius: 18,
                                        padding: 14,
                                        borderWidth: 0.5,
                                        borderColor: t.border,
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
                                        {translate('home.header.lastWorkout')}
                                    </Text>
                                    <Text
                                        style={{
                                            color: t.textPrimary,
                                            fontSize: 22,
                                            fontWeight: '900',
                                            marginTop: 6,
                                        }}
                                    >
                                        {summary.lastWorkoutLabel ??
                                            translate('home.header.noRecord')}
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        flex: 1,
                                        backgroundColor: t.inputBg,
                                        borderRadius: 18,
                                        padding: 14,
                                        borderWidth: 0.5,
                                        borderColor: t.border,
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
                                        {translate('home.header.nextTarget')}
                                    </Text>
                                    <Text
                                        style={{
                                            color: t.textPrimary,
                                            fontSize: 18,
                                            fontWeight: '900',
                                            marginTop: 6,
                                        }}
                                    >
                                        {summary.nextPlannedDayLabel ??
                                            translate('home.header.buildWeek')}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.82}
                                onPress={() => navigation.navigate('Week')}
                                style={{ marginTop: 18 }}
                            >
                                <LinearGradient
                                    colors={t.gradientAccent}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 10,
                                        paddingVertical: 15,
                                        borderRadius: 18,
                                    }}
                                >
                                    <Ionicons
                                        name='calendar-outline'
                                        size={20}
                                        color={btnColor}
                                    />
                                    <Text
                                        style={{
                                            color: btnColor,
                                            fontSize: 16,
                                            fontWeight: '900',
                                        }}
                                    >
                                        {translate('home.header.openWeek')}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </AnimatedCard>

                <AnimatedCard index={1}>
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
                </AnimatedCard>

                <AnimatedCard index={2}>
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
                                    summary.totalMachinesScheduled !== 1
                                        ? 's'
                                        : '',
                            })}
                            icon='calendar-clear-outline'
                        />
                    </View>
                </AnimatedCard>

                <AnimatedCard index={3}>
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
                                          summary.machineProgress.length !== 1
                                              ? 's'
                                              : '',
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
                </AnimatedCard>

                <AnimatedCard index={4}>
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
                                      daySuffix:
                                          summary.scheduledDayCount > 1
                                              ? 's'
                                              : '',
                                      builtSuffix:
                                          summary.scheduledDayCount > 1
                                              ? 's'
                                              : '',
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
                                            borderColor: day.isToday
                                                ? t.accent
                                                : t.border,
                                            opacity: isActive ? 1 : 0.72,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: day.isToday
                                                    ? t.accent
                                                    : t.textDim,
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
                                                    day.machineCount !== 1
                                                        ? 's'
                                                        : '',
                                            })}
                                        </Text>
                                    </View>
                                )
                            })}
                        </View>
                    </DashboardPanel>
                </AnimatedCard>
            </ScrollView>

            <ConfirmModal
                visible={!!activeWorkoutSession}
                title={translate('workout.resume.title')}
                message={translate('workout.resume.message')}
                confirmLabel={translate('workout.resume.confirm')}
                cancelLabel={translate('workout.resume.cancel')}
                confirmVariant='accent'
                onClose={() => {
                    void (async () => {
                        await clearActiveWorkoutSession()
                        setActiveWorkoutSession(null)
                    })()
                }}
                onConfirm={() => {
                    if (!activeWorkoutSession) return

                    navigation.navigate('Workout', {
                        workoutId: activeWorkoutSession.workoutId,
                        resume: true,
                    })
                    setActiveWorkoutSession(null)
                }}
            />
        </>
    )
}
