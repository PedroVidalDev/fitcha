import { useDashboardSummary } from '@/src/hooks/useDashboardSummary'
import { RootStackParamList } from '@/src/router/types'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useCallback, useState } from 'react'
import {
    ActivityIndicator,
    ScrollView,
    View,
    useWindowDimensions,
} from 'react-native'
import { AnimatedCard } from '../../components/AnimatedCard'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'
import { useTheme } from '../../contexts/ThemeContext'
import {
    ActiveWorkoutSession,
    clearActiveWorkoutSession,
    getActiveWorkoutSession,
} from '../../services/activeWorkout'
import {
    getCachedCustomMachines,
    loadWorkoutData,
} from '../../services/workoutData'
import { HomeCustomMachinesShortcut } from './components/HomeCustomMachinesShortcut'
import { HomeFeaturedPlanSection } from './components/HomeFeaturedPlanSection'
import { HomeHeroCard } from './components/HomeHeroCard'
import { HomeRhythmSection } from './components/HomeRhythmSection'
import { HomeStatsSection } from './components/HomeStatsSection'
import { ResumeWorkoutModal } from './components/ResumeWorkoutModal'
import { getFirstName } from './helpers'
import { type HomeScreenProps } from './types'

type Navigation = NativeStackNavigationProp<RootStackParamList, 'Home'>

export default function HomeScreen(props: HomeScreenProps) {
    void props

    const { t } = useTheme()
    const { t: translate } = useI18n()
    const { user } = useAuth()
    const navigation = useNavigation<Navigation>()
    const { width } = useWindowDimensions()
    const { summary, isLoading, refresh } = useDashboardSummary()
    const [activeWorkoutSession, setActiveWorkoutSession] =
        useState<ActiveWorkoutSession | null>(null)
    const [customMachineCount, setCustomMachineCount] = useState(0)

    useFocusEffect(
        useCallback(() => {
            let isActive = true

            void refresh()
            void (async () => {
                const cachedMachines = await getCachedCustomMachines()
                if (!isActive) return
                setCustomMachineCount(cachedMachines.length)

                const data = await loadWorkoutData()
                if (!isActive) return
                setCustomMachineCount(
                    Object.values(data.machines).filter(
                        (machine) => !machine.catalogMachineId,
                    ).length,
                )
            })()
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

    const handleOpenWeek = useCallback(() => {
        navigation.navigate('Week')
    }, [navigation])

    const handleOpenCustomMachines = useCallback(() => {
        navigation.navigate('CustomMachines')
    }, [navigation])

    const handleCloseActiveWorkoutSession = useCallback(() => {
        void (async () => {
            await clearActiveWorkoutSession()
            setActiveWorkoutSession(null)
        })()
    }, [])

    const handleResumeActiveWorkoutSession = useCallback(() => {
        if (!activeWorkoutSession) return

        navigation.navigate('Workout', {
            workoutId: activeWorkoutSession.workoutId,
            resume: true,
        })
        setActiveWorkoutSession(null)
    }, [activeWorkoutSession, navigation])

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

    const firstName = getFirstName(
        user?.name,
        translate('home.greetingFallback'),
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
                    <HomeHeroCard
                        summary={summary}
                        firstName={firstName}
                        onOpenWeek={handleOpenWeek}
                    />
                </AnimatedCard>

                <AnimatedCard index={1}>
                    <HomeStatsSection summary={summary} />
                </AnimatedCard>

                <AnimatedCard index={2}>
                    <HomeStatsSection summary={summary} variant='secondary' />
                </AnimatedCard>

                <AnimatedCard index={3}>
                    <HomeCustomMachinesShortcut
                        count={customMachineCount}
                        onPress={handleOpenCustomMachines}
                    />
                </AnimatedCard>

                <AnimatedCard index={4}>
                    <HomeFeaturedPlanSection
                        summary={summary}
                        progressCardWidth={progressCardWidth}
                    />
                </AnimatedCard>

                <AnimatedCard index={5}>
                    <HomeRhythmSection summary={summary} />
                </AnimatedCard>
            </ScrollView>

            <ResumeWorkoutModal
                activeWorkoutSession={activeWorkoutSession}
                onClose={handleCloseActiveWorkoutSession}
                onConfirm={handleResumeActiveWorkoutSession}
            />
        </>
    )
}
