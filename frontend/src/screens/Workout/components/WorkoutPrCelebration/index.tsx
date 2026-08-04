import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import { type WorkoutPrCelebrationProps } from './types'

const PARTICLES = [
    { left: '8%', color: '#FFC857', size: 9, drift: -18, spin: '300deg' },
    { left: '16%', color: '#2CBAC8', size: 7, drift: 20, spin: '-260deg' },
    { left: '24%', color: '#F38C2B', size: 11, drift: -12, spin: '340deg' },
    { left: '33%', color: '#9B6DFF', size: 8, drift: 24, spin: '-320deg' },
    { left: '42%', color: '#FF6B6B', size: 10, drift: -22, spin: '280deg' },
    { left: '51%', color: '#FFC857', size: 7, drift: 16, spin: '-300deg' },
    { left: '60%', color: '#2CBAC8', size: 11, drift: -16, spin: '360deg' },
    { left: '69%', color: '#F38C2B', size: 8, drift: 22, spin: '-280deg' },
    { left: '78%', color: '#9B6DFF', size: 10, drift: -20, spin: '320deg' },
    { left: '88%', color: '#FF6B6B', size: 7, drift: 14, spin: '-340deg' },
] as const

function formatMetric(value: number) {
    return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

export function WorkoutPrCelebration(props: WorkoutPrCelebrationProps) {
    const { celebration, onFinished } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()
    const progress = useRef(new Animated.Value(0)).current

    useEffect(() => {
        if (!celebration) return

        progress.setValue(0)
        void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
        ).catch(() => undefined)

        const animation = Animated.timing(progress, {
            toValue: 1,
            duration: 2600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        })

        animation.start(({ finished }) => {
            if (finished) onFinished()
        })

        return () => animation.stop()
    }, [celebration, onFinished, progress])

    if (!celebration) return null

    const cardOpacity = progress.interpolate({
        inputRange: [0, 0.08, 0.78, 1],
        outputRange: [0, 1, 1, 0],
    })
    const cardScale = progress.interpolate({
        inputRange: [0, 0.1, 0.2, 0.82, 1],
        outputRange: [0.55, 1.08, 1, 1, 0.96],
    })
    const cardTranslateY = progress.interpolate({
        inputRange: [0, 0.16, 0.8, 1],
        outputRange: [24, 0, 0, -14],
    })
    const backdropOpacity = progress.interpolate({
        inputRange: [0, 0.12, 0.82, 1],
        outputRange: [0, 0.72, 0.72, 0],
    })
    const particleOpacity = progress.interpolate({
        inputRange: [0, 0.08, 0.76, 1],
        outputRange: [0, 1, 1, 0],
    })
    const particleTranslateY = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [-120, 560],
    })

    const metricLabel = translate(
        celebration.metricKind === 'weight'
            ? 'workout.pr.volume'
            : 'workout.pr.reps',
        { value: formatMetric(celebration.metricValue) },
    )

    return (
        <View
            pointerEvents='none'
            style={[StyleSheet.absoluteFillObject, styles.overlay]}
        >
            <Animated.View
                style={[
                    StyleSheet.absoluteFillObject,
                    {
                        opacity: backdropOpacity,
                        backgroundColor: t.bg,
                    },
                ]}
            />

            <View style={StyleSheet.absoluteFillObject}>
                {PARTICLES.map((particle, index) => {
                    const translateX = progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, particle.drift],
                    })
                    const rotate = progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', particle.spin],
                    })

                    return (
                        <Animated.View
                            key={`${celebration.id}-${index}`}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: particle.left,
                                width: particle.size,
                                height: particle.size * 1.8,
                                borderRadius: 3,
                                backgroundColor: particle.color,
                                opacity: particleOpacity,
                                transform: [
                                    { translateX },
                                    { translateY: particleTranslateY },
                                    { rotate },
                                ],
                            }}
                        />
                    )
                })}
            </View>

            <View style={styles.centerContent}>
                <Animated.View
                    style={{
                        width: '86%',
                        maxWidth: 360,
                        opacity: cardOpacity,
                        transform: [
                            { translateY: cardTranslateY },
                            { scale: cardScale },
                        ],
                    }}
                >
                    <LinearGradient
                        colors={[t.accent, t.accentDark]}
                        style={styles.card}
                    >
                        <View style={styles.iconCircle}>
                            <Ionicons
                                name='trophy'
                                size={42}
                                color={t.accentDark}
                            />
                        </View>

                        <Text style={[styles.kicker, { color: t.btnColor }]}>
                            {translate('workout.pr.kicker')}
                        </Text>
                        <Text style={[styles.title, { color: t.btnColor }]}>
                            {translate('workout.pr.title')}
                        </Text>
                        <Text style={[styles.machine, { color: t.btnColor }]}>
                            {celebration.machineName}
                        </Text>

                        <View style={styles.metricPill}>
                            <Ionicons
                                name='trending-up'
                                size={17}
                                color={t.btnColor}
                            />
                            <Text
                                style={[styles.metric, { color: t.btnColor }]}
                            >
                                {metricLabel}
                            </Text>
                        </View>
                    </LinearGradient>
                </Animated.View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    centerContent: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    overlay: {
        zIndex: 50,
        elevation: 50,
    },
    card: {
        alignItems: 'center',
        borderRadius: 28,
        paddingHorizontal: 24,
        paddingVertical: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.28,
        shadowRadius: 22,
        elevation: 16,
    },
    iconCircle: {
        width: 78,
        height: 78,
        borderRadius: 39,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.86)',
    },
    kicker: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2.2,
        marginBottom: 6,
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        textAlign: 'center',
    },
    machine: {
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 8,
        opacity: 0.82,
    },
    metricPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        marginTop: 18,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.18)',
    },
    metric: {
        fontSize: 14,
        fontWeight: '900',
    },
})
