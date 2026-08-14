import { useTheme } from '@/src/contexts/ThemeContext'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef } from 'react'
import { Animated, Pressable, StyleSheet, View } from 'react-native'
import { type HoldToActionCardProps } from './types'

export function HoldToActionCard(props: HoldToActionCardProps) {
    const {
        children,
        onComplete,
        disabled = false,
        durationMs = 750,
        borderRadius = 12,
        accessibilityLabel,
        accessibilityHint,
        style,
    } = props
    const { t } = useTheme()
    const progress = useRef(new Animated.Value(0)).current
    const animationRef = useRef<Animated.CompositeAnimation | null>(null)
    const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const completedRef = useRef(false)
    const onCompleteRef = useRef(onComplete)

    useEffect(() => {
        onCompleteRef.current = onComplete
    }, [onComplete])

    useEffect(
        () => () => {
            animationRef.current?.stop()
            if (resetTimeoutRef.current) {
                clearTimeout(resetTimeoutRef.current)
            }
        },
        [],
    )

    const resetProgress = (animated: boolean) => {
        animationRef.current?.stop()

        if (!animated) {
            progress.setValue(0)
            return
        }

        animationRef.current = Animated.timing(progress, {
            toValue: 0,
            duration: 160,
            useNativeDriver: false,
        })
        animationRef.current.start()
    }

    const handlePressIn = () => {
        if (disabled) return

        completedRef.current = false
        if (resetTimeoutRef.current) {
            clearTimeout(resetTimeoutRef.current)
        }
        animationRef.current?.stop()
        progress.setValue(0)
        animationRef.current = Animated.timing(progress, {
            toValue: 1,
            duration: durationMs,
            useNativeDriver: false,
        })
        animationRef.current.start(({ finished }) => {
            if (!finished || completedRef.current) return

            completedRef.current = true
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
                () => undefined,
            )
            onCompleteRef.current()
            resetTimeoutRef.current = setTimeout(() => {
                progress.setValue(0)
            }, 220)
        })
    }

    const handlePressOut = () => {
        const didComplete = completedRef.current
        completedRef.current = false
        resetProgress(!didComplete)
    }

    const animatedWidth = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    })
    const gradientColors: [string, string] =
        t.mode === 'dark'
            ? ['rgba(3, 7, 12, 0.18)', 'rgba(3, 7, 12, 0.72)']
            : ['rgba(25, 34, 46, 0.08)', 'rgba(25, 34, 46, 0.42)']

    return (
        <Pressable
            accessibilityRole='button'
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={accessibilityHint}
            accessibilityActions={[{ name: 'activate' }]}
            onAccessibilityAction={(event) => {
                if (event.nativeEvent.actionName === 'activate' && !disabled) {
                    onCompleteRef.current()
                }
            }}
            disabled={disabled}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[{ borderRadius, overflow: 'hidden' }, style]}
        >
            {children}

            <Animated.View
                pointerEvents='none'
                style={[
                    styles.progressOverlay,
                    { width: animatedWidth, borderRadius },
                ]}
            >
                <View style={styles.gradientClip}>
                    <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={StyleSheet.absoluteFillObject}
                    />
                </View>
            </Animated.View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    progressOverlay: {
        ...StyleSheet.absoluteFillObject,
        right: undefined,
        zIndex: 5,
        overflow: 'hidden',
    },
    gradientClip: {
        width: '100%',
        height: '100%',
    },
})
