import { AddMachineCategoryFilters } from '@/src/components/AddMachineModal/components/AddMachineCategoryFilters'
import { AddMachineSearchField } from '@/src/components/AddMachineModal/components/AddMachineSearchField'
import { AddMachineCategoryFilter } from '@/src/components/AddMachineModal/types'
import { CategoryBadge } from '@/src/components/CategoryBadge'
import { ConfirmModal } from '@/src/components/ConfirmModal'
import { CustomMachineFormModal } from '@/src/components/CustomMachineFormModal'
import { MachineImage } from '@/src/components/MachineImage'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Machine } from '@/src/dtos/Machine'
import { RootStackParamList } from '@/src/router/types'
import {
    createCustomMachine,
    deleteCustomMachine,
    getCachedCustomMachines,
    loadWorkoutData,
    updateCustomMachine,
} from '@/src/services/workoutData'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useMemo, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

type Navigation = NativeStackNavigationProp<
    RootStackParamList,
    'CustomMachines'
>

export default function CustomMachinesScreen() {
    const { t } = useTheme()
    const { t: translate } = useI18n()
    const navigation = useNavigation<Navigation>()
    const [machines, setMachines] = useState<Machine[]>([])
    const [query, setQuery] = useState('')
    const [category, setCategory] = useState<AddMachineCategoryFilter>('all')
    const [isLoading, setIsLoading] = useState(true)
    const [formMachine, setFormMachine] = useState<Machine | null>()
    const [deleteTarget, setDeleteTarget] = useState<Machine | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const refresh = useCallback(async () => {
        const cachedMachines = await getCachedCustomMachines()
        setMachines(cachedMachines)
        setIsLoading(cachedMachines.length === 0)

        const data = await loadWorkoutData({ forceSync: true })
        setMachines(
            Object.values(data.machines).filter(
                (machine) => !machine.catalogMachineId,
            ),
        )
        setIsLoading(false)
    }, [])

    useFocusEffect(
        useCallback(() => {
            void refresh()
        }, [refresh]),
    )

    const filteredMachines = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()

        return machines.filter(
            (machine) =>
                (category === 'all' || machine.categoryKey === category) &&
                (!normalizedQuery ||
                    [machine.name, machine.description ?? '']
                        .join(' ')
                        .toLowerCase()
                        .includes(normalizedQuery)),
        )
    }, [category, machines, query])

    const closeForm = () => setFormMachine(undefined)

    const handleDelete = async () => {
        if (!deleteTarget || isDeleting) return

        setIsDeleting(true)
        try {
            await deleteCustomMachine(deleteTarget.id)
            setMachines((current) =>
                current.filter((machine) => machine.id !== deleteTarget.id),
            )
            setDeleteTarget(null)
        } catch (error) {
            setDeleteTarget(null)
            Alert.alert(
                translate('customMachines.deleteErrorTitle'),
                error instanceof Error
                    ? error.message
                    : translate('customMachines.deleteError'),
            )
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps='handled'
                contentContainerStyle={{ padding: 16, paddingBottom: 42 }}
            >
                <LinearGradient
                    colors={t.gradientHero}
                    style={{
                        borderRadius: 22,
                        padding: 18,
                        borderWidth: 1,
                        borderColor: t.border,
                        overflow: 'hidden',
                        marginBottom: 14,
                    }}
                >
                    <View
                        style={{
                            position: 'absolute',
                            right: -18,
                            top: -24,
                            width: 92,
                            height: 92,
                            borderRadius: 999,
                            backgroundColor: t.chipBg,
                        }}
                    />
                    <Text
                        style={{
                            color: t.accent,
                            fontSize: 23,
                            fontWeight: '900',
                        }}
                    >
                        {translate('customMachines.title')}
                    </Text>
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 13,
                            lineHeight: 19,
                            marginTop: 7,
                            maxWidth: '82%',
                        }}
                    >
                        {translate('customMachines.summary', {
                            count: machines.length,
                        })}
                    </Text>
                </LinearGradient>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setFormMachine(null)}
                    style={{ marginBottom: 16 }}
                >
                    <LinearGradient
                        colors={t.gradientAccent}
                        style={{
                            borderRadius: 15,
                            paddingVertical: 14,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 9,
                        }}
                    >
                        <Ionicons
                            name='add-circle'
                            size={21}
                            color={t.btnColor}
                        />
                        <Text
                            style={{
                                color: t.btnColor,
                                fontSize: 15,
                                fontWeight: '900',
                            }}
                        >
                            {translate('customMachines.createAction')}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                <AddMachineCategoryFilters
                    categoryFilter={category}
                    onSelectFilter={setCategory}
                />
                <AddMachineSearchField value={query} onChangeText={setQuery} />

                {isLoading ? (
                    <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                        <ActivityIndicator size='large' color={t.accent} />
                    </View>
                ) : filteredMachines.length === 0 ? (
                    <View
                        style={{
                            paddingVertical: 46,
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <Ionicons
                            name='barbell-outline'
                            size={34}
                            color={t.textDim}
                        />
                        <Text
                            style={{
                                color: t.textMuted,
                                fontSize: 14,
                                lineHeight: 20,
                                textAlign: 'center',
                            }}
                        >
                            {translate(
                                machines.length === 0
                                    ? 'customMachines.empty'
                                    : 'customMachines.noResults',
                            )}
                        </Text>
                    </View>
                ) : (
                    <View style={{ gap: 10 }}>
                        {filteredMachines.map((machine) => (
                            <TouchableOpacity
                                key={machine.id}
                                activeOpacity={0.8}
                                onPress={() =>
                                    navigation.navigate('MachineDetail', {
                                        machineId: machine.id,
                                    })
                                }
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: 12,
                                    borderRadius: 16,
                                    backgroundColor: t.card,
                                    borderWidth: 1,
                                    borderColor: t.border,
                                }}
                            >
                                {machine.photo ? (
                                    <MachineImage
                                        uri={machine.photo}
                                        style={{
                                            width: 58,
                                            height: 58,
                                            borderRadius: 13,
                                        }}
                                    />
                                ) : (
                                    <View
                                        style={{
                                            width: 58,
                                            height: 58,
                                            borderRadius: 13,
                                            backgroundColor: t.chipBg,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Ionicons
                                            name='barbell-outline'
                                            size={24}
                                            color={t.accent}
                                        />
                                    </View>
                                )}

                                <View style={{ flex: 1 }}>
                                    <Text
                                        numberOfLines={1}
                                        style={{
                                            color: t.textPrimary,
                                            fontSize: 15,
                                            fontWeight: '900',
                                        }}
                                    >
                                        {machine.name}
                                    </Text>
                                    <View style={{ marginTop: 5 }}>
                                        <CategoryBadge
                                            categoryKey={machine.categoryKey}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    accessibilityLabel={translate(
                                        'customMachines.editAccessibility',
                                    )}
                                    onPress={() => setFormMachine(machine)}
                                    style={{ padding: 8 }}
                                >
                                    <Ionicons
                                        name='create-outline'
                                        size={20}
                                        color={t.accent}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    accessibilityLabel={translate(
                                        'customMachines.deleteAccessibility',
                                    )}
                                    onPress={() => setDeleteTarget(machine)}
                                    style={{ padding: 8 }}
                                >
                                    <Ionicons
                                        name='trash-outline'
                                        size={19}
                                        color='#EF5350'
                                    />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            <CustomMachineFormModal
                visible={formMachine !== undefined}
                machine={formMachine}
                onClose={closeForm}
                onSubmit={async (input) => {
                    if (formMachine) {
                        const updated = await updateCustomMachine(
                            formMachine.id,
                            input,
                        )
                        setMachines((current) =>
                            current.map((machine) =>
                                machine.id === updated.id ? updated : machine,
                            ),
                        )
                        return
                    }

                    const created = await createCustomMachine(input)
                    setMachines((current) => [...current, created])
                }}
            />

            <ConfirmModal
                visible={!!deleteTarget}
                title={translate('customMachines.deleteTitle')}
                message={translate('customMachines.deleteMessage', {
                    name: deleteTarget?.name ?? '',
                })}
                confirmLabel={translate('common.actions.delete')}
                isBusy={isDeleting}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => void handleDelete()}
            />
        </View>
    )
}
