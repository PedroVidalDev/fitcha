import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Platform, Text, TouchableOpacity, View } from 'react-native'
import { type HomeHeroCardProps } from './types'

export function HomeHeroCard(props: HomeHeroCardProps) {
    const { summary, firstName, onOpenWeek } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()
    const btnColor = t.home.buttonText

    return (
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
                        ? translate('home.header.summaryWithHistory', {
                              streak: summary.streak,
                              streakSuffix: summary.streak !== 1 ? 's' : '',
                              recent: summary.recentWorkoutDays,
                              recentSuffix:
                                  summary.recentWorkoutDays !== 1 ? 's' : '',
                              activeSuffix:
                                  summary.recentWorkoutDays !== 1 ? 's' : '',
                          })
                        : translate('home.header.summaryWithoutHistory')}
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
                    onPress={onOpenWeek}
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
    )
}
