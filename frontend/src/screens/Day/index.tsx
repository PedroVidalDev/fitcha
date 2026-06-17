import { AddMachineModal } from '@/src/components/AddMachineModal'
import { WorkoutFormModal } from '@/src/components/WorkoutFormModal'
import { useWorkoutMachines } from '@/src/hooks/useWorkoutMachines'
import { useWorkouts } from '@/src/hooks/useWorkouts'
import { RootStackParamList } from '@/src/router/types'
import { Ionicons } from '@expo/vector-icons'
import {
    RouteProp,
    useNavigation,
    useRoute,
    useFocusEffect,
} from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useLayoutEffect, useMemo, useState } from 'react'
import {
    ActivityIndicator,
    FlatList,
    Image,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { AnimatedCard } from '../../components/AnimatedCard'
import { CategoryBadge } from '../../components/CategoryBadge'
import { ConfirmModal } from '../../components/ConfirmModal'
import { GradientCard } from '../../components/GradientCard'
import { useI18n } from '../../contexts/I18nContext'
import { useTheme } from '../../contexts/ThemeContext'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Day'>
type Route = RouteProp<RootStackParamList, 'Day'>

export default function DayScreen() {
    const { t } = useTheme()
    const { t: translate } = useI18n()

    const navigation = useNavigation<Nav>()
    const route = useRoute<Route>()
    const workoutId = route.params.workoutId

    const {
        addMachineToWorkout,
        removeMachineFromWorkout,
        updateWorkout,
        deleteWorkout,
        refresh: refreshWorkouts,
    } = useWorkouts()
    const { workout, machines, refresh, isLoading } =
        useWorkoutMachines(workoutId)

    const [deleteTarget, setDeleteTarget] = useState<{
        id: string
        name: string
    } | null>(null)
    const [isAddModalVisible, setIsAddModalVisible] = useState(false)
    const [isEditModalVisible, setIsEditModalVisible] = useState(false)
    const [isDeleteWorkoutVisible, setIsDeleteWorkoutVisible] = useState(false)
    const btnColor = t.mode === 'dark' ? '#0d0500' : '#FFF'
    const totalMachines = machines.length

    useLayoutEffect(() => {
        navigation.setOptions({
            title: workout?.title ?? translate('day.title'),
        })
    }, [navigation, translate, workout?.title])

    useFocusEffect(
        useCallback(() => {
            void refresh()
            void refreshWorkouts()
        }, [refresh, refreshWorkouts]),
    )

    const categories = useMemo(
        () => [...new Set(machines.map((machine) => machine.categoryKey))],
        [machines],
    )

    if (isLoading) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: t.bg,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <ActivityIndicator size='large' color={t.accent} />
            </View>
        )
    }

    if (!workout) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: t.bg,
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 24,
                }}
            >
                <Text
                    style={{
                        color: t.textPrimary,
                        fontSize: 18,
                        fontWeight: '800',
                    }}
                >
                    {translate('day.notFoundTitle')}
                </Text>
                <Text
                    style={{
                        color: t.textMuted,
                        fontSize: 13,
                        lineHeight: 19,
                        marginTop: 8,
                        textAlign: 'center',
                    }}
                >
                    {translate('day.notFoundMessage')}
                </Text>
            </View>
        )
    }

    return (
        <View style={{ flex: 1, backgroundColor: t.bg, padding: 16 }}>
            <LinearGradient
                colors={t.gradientHero}
                style={{
                    borderRadius: 22,
                    padding: 18,
                    marginBottom: 18,
                    borderWidth: 1,
                    borderColor: t.border,
                    overflow: 'hidden',
                }}
            >
                <View
                    style={{
                        position: 'absolute',
                        right: -18,
                        top: -26,
                        width: 90,
                        height: 90,
                        borderRadius: 999,
                        backgroundColor: t.chipBg,
                    }}
                />
                <Text
                    style={{
                        color: t.textDim,
                        fontSize: 11,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 2,
                    }}
                >
                    {translate('day.machineCount', {
                        count: totalMachines,
                        pluralSuffix: totalMachines !== 1 ? 's' : '',
                    })}
                </Text>
                <Text
                    style={{
                        color: t.textPrimary,
                        fontSize: 24,
                        fontWeight: '900',
                        marginTop: 8,
                    }}
                >
                    {workout.title}
                </Text>
                <Text
                    style={{
                        color: t.textMuted,
                        fontSize: 13,
                        lineHeight: 19,
                        marginTop: 8,
                    }}
                >
                    {workout.description?.trim() ||
                        translate('day.emptyDescription')}
                </Text>
            </LinearGradient>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setIsAddModalVisible(true)}
                    style={{ flex: 1 }}
                >
                    <LinearGradient
                        colors={t.gradientAccent}
                        style={{
                            borderRadius: 16,
                            paddingVertical: 14,
                            paddingHorizontal: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                        }}
                    >
                        <Ionicons
                            name='add-circle'
                            size={22}
                            color={btnColor}
                        />
                        <Text
                            style={{
                                color: btnColor,
                                fontSize: 16,
                                fontWeight: '900',
                            }}
                        >
                            {translate('day.addButton')}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setIsEditModalVisible(true)}
                    style={{
                        width: 56,
                        borderRadius: 16,
                        backgroundColor: t.inputBg,
                        borderWidth: 0.5,
                        borderColor: t.border,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons
                        name='create-outline'
                        size={22}
                        color={t.textPrimary}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setIsDeleteWorkoutVisible(true)}
                    style={{
                        width: 56,
                        borderRadius: 16,
                        backgroundColor: t.inputBg,
                        borderWidth: 0.5,
                        borderColor: t.border,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name='trash-outline' size={22} color='#EF5350' />
                </TouchableOpacity>
            </View>

            <FlatList
                data={machines}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ gap: 12, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    categories.length > 0 ? (
                        <View
                            style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: 8,
                                marginBottom: 14,
                            }}
                        >
                            {categories.map((categoryKey) => (
                                <CategoryBadge
                                    key={categoryKey}
                                    categoryKey={categoryKey}
                                />
                            ))}
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    <View
                        style={{
                            backgroundColor: t.inputBg,
                            borderRadius: 18,
                            borderWidth: 0.5,
                            borderColor: t.border,
                            padding: 18,
                        }}
                    >
                        <Text
                            style={{
                                color: t.textPrimary,
                                fontSize: 16,
                                fontWeight: '800',
                            }}
                        >
                            {translate('day.emptyMachines')}
                        </Text>
                        <Text
                            style={{
                                color: t.textMuted,
                                fontSize: 13,
                                lineHeight: 19,
                                marginTop: 6,
                            }}
                        >
                            {translate('day.emptyMachinesHint')}
                        </Text>
                    </View>
                }
                renderItem={({ item, index }) => (
                    <AnimatedCard index={index}>
                        <GradientCard
                            onPress={() =>
                                navigation.push('MachineDetail', {
                                    machineId: item.id,
                                })
                            }
                            onLongPress={() =>
                                setDeleteTarget({
                                    id: item.id,
                                    name: item.name,
                                })
                            }
                        >
                            {item.photo ? (
                                <Image
                                    source={{ uri: item.photo }}
                                    style={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: t.border,
                                    }}
                                    resizeMode='cover'
                                />
                            ) : (
                                <View
                                    style={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: 12,
                                        backgroundColor: t.chipBg,
                                        borderWidth: 1,
                                        borderColor: t.border,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Ionicons
                                        name='barbell-outline'
                                        size={22}
                                        color={t.accent}
                                    />
                                </View>
                            )}
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        color: t.textPrimary,
                                        fontSize: 16,
                                        fontWeight: '700',
                                    }}
                                >
                                    {item.name}
                                </Text>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginTop: 4,
                                    }}
                                >
                                    <CategoryBadge
                                        categoryKey={item.categoryKey}
                                    />
                                    {item.lastWeight && (
                                        <Text
                                            style={{
                                                color: t.accent,
                                                fontSize: 12,
                                                fontWeight: '700',
                                            }}
                                        >
                                            {translate('day.maxWeight', {
                                                weight: item.lastWeight,
                                            })}
                                        </Text>
                                    )}
                                </View>
                                {item.description && (
                                    <Text
                                        style={{
                                            color: t.textDim,
                                            fontSize: 12,
                                            marginTop: 4,
                                        }}
                                        numberOfLines={1}
                                    >
                                        {item.description}
                                    </Text>
                                )}
                            </View>
                            <Ionicons
                                name='chevron-forward'
                                size={18}
                                color={t.textMuted}
                            />
                        </GradientCard>
                    </AnimatedCard>
                )}
            />

            {machines.length > 0 && (
                <View
                    style={{
                        position: 'absolute',
                        bottom: 24,
                        left: 16,
                        right: 16,
                    }}
                >
                    <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() =>
                            navigation.navigate('Workout', { workoutId })
                        }
                    >
                        <LinearGradient
                            colors={t.gradientAccent}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                                paddingVertical: 16,
                                borderRadius: 16,
                            }}
                        >
                            <Ionicons
                                name='play-circle'
                                size={24}
                                color={btnColor}
                            />
                            <Text
                                style={{
                                    color: btnColor,
                                    fontSize: 18,
                                    fontWeight: '900',
                                }}
                            >
                                {translate('common.actions.startWorkout')}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            <WorkoutFormModal
                visible={isEditModalVisible}
                title={translate('workoutForm.editTitle')}
                initialName={workout.title}
                initialDescription={workout.description}
                submitLabel={translate('workoutForm.saveAction')}
                onClose={() => setIsEditModalVisible(false)}
                onSubmit={async (name, description) => {
                    await updateWorkout(workoutId, name, description)
                    await refresh()
                }}
            />

            <AddMachineModal
                visible={isAddModalVisible}
                onClose={() => setIsAddModalVisible(false)}
                onAdd={async (catalogMachineId) => {
                    await addMachineToWorkout(workoutId, catalogMachineId)
                    await refresh()
                }}
            />

            <ConfirmModal
                visible={!!deleteTarget}
                title={translate('day.remove.title')}
                message={translate('day.remove.message', {
                    name: deleteTarget?.name ?? '',
                })}
                confirmLabel={translate('common.actions.remove')}
                onClose={() => setDeleteTarget(null)}
                onConfirm={async () => {
                    if (deleteTarget) {
                        await removeMachineFromWorkout(
                            workoutId,
                            deleteTarget.id,
                        )
                        await refresh()
                    }
                    setDeleteTarget(null)
                }}
            />

            <ConfirmModal
                visible={isDeleteWorkoutVisible}
                title={translate('day.removeWorkout.title')}
                message={translate('day.removeWorkout.message', {
                    name: workout.title,
                })}
                confirmLabel={translate('common.actions.remove')}
                onClose={() => setIsDeleteWorkoutVisible(false)}
                onConfirm={async () => {
                    await deleteWorkout(workoutId)
                    setIsDeleteWorkoutVisible(false)
                    navigation.goBack()
                }}
            />
        </View>
    )
}
