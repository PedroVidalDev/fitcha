import { AnimatedCard } from '@/src/components/AnimatedCard'
import { CategoryBadge } from '@/src/components/CategoryBadge'
import { GradientCard } from '@/src/components/GradientCard'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { RootStackParamList } from '@/src/router/types'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text, View } from 'react-native'
import { WorkoutProps } from './types'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Week'>

export const Workout = (props: WorkoutProps) => {
    const { index, workout } = props

    const navigation = useNavigation<Nav>()

    const { t: translate } = useI18n()
    const { t } = useTheme()

    const isEmpty = workout.machines.length === 0

    return (
        <AnimatedCard index={index}>
            <GradientCard
                onPress={() => {
                    navigation.navigate('Day', {
                        workoutId: workout.id,
                    })
                }}
            >
                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            color: t.textPrimary,
                            fontSize: 16,
                            fontWeight: '700',
                        }}
                    >
                        {workout.title}
                    </Text>

                    {workout.description ? (
                        <Text
                            style={{
                                color: t.textMuted,
                                fontSize: 12,
                                lineHeight: 18,
                                marginTop: 6,
                            }}
                            numberOfLines={2}
                        >
                            {workout.description}
                        </Text>
                    ) : null}

                    {isEmpty ? (
                        <Text
                            style={{
                                color: t.textDim,
                                fontSize: 12,
                                marginTop: 8,
                                fontStyle: 'italic',
                            }}
                        >
                            {translate('day.emptyMachines')}
                        </Text>
                    ) : (
                        <View
                            style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: 6,
                                marginTop: 10,
                            }}
                        >
                            {[
                                ...new Set(
                                    workout.machines.map(
                                        (machine) => machine.categoryKey,
                                    ),
                                ),
                            ].map((key) => (
                                <CategoryBadge key={key} categoryKey={key} />
                            ))}
                            <Text
                                style={{
                                    color: t.textDim,
                                    fontSize: 11,
                                    alignSelf: 'center',
                                    marginLeft: 2,
                                }}
                            >
                                {translate('week.machineCount', {
                                    count: workout.machines.length,
                                    pluralSuffix:
                                        workout.machines.length !== 1
                                            ? 's'
                                            : '',
                                })}
                            </Text>
                        </View>
                    )}
                </View>

                <Ionicons
                    name='chevron-forward'
                    size={18}
                    color={t.textMuted}
                />
            </GradientCard>
        </AnimatedCard>
    )
}
