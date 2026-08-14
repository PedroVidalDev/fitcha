import { AddMachineCategoryFilters } from '@/src/components/AddMachineModal/components/AddMachineCategoryFilters'
import { AddMachineSearchField } from '@/src/components/AddMachineModal/components/AddMachineSearchField'
import { AddMachineSourceFilters } from '@/src/components/AddMachineModal/components/AddMachineSourceFilters'
import {
    AddMachineCategoryFilter,
    AddMachineSourceFilter,
} from '@/src/components/AddMachineModal/types'
import { CategoryBadge } from '@/src/components/CategoryBadge'
import { ConfirmModal } from '@/src/components/ConfirmModal'
import { CustomMachineFormModal } from '@/src/components/CustomMachineFormModal'
import { MachineImage } from '@/src/components/MachineImage'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { CatalogMachine } from '@/src/dtos/CatalogMachine'
import { Machine } from '@/src/dtos/Machine'
import { MainTabParamList, RootStackParamList } from '@/src/router/types'
import {
    getCachedCatalogMachines,
    getCatalogMachines,
} from '@/src/services/catalogMachines'
import {
    createCustomMachine,
    deleteCustomMachine,
    getCachedCustomMachines,
    loadWorkoutData,
    updateCustomMachine,
} from '@/src/services/workoutData'
import { Ionicons } from '@expo/vector-icons'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import {
    CompositeNavigationProp,
    useFocusEffect,
    useNavigation,
} from '@react-navigation/native'
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

type Navigation = CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'CustomMachines'>,
    NativeStackNavigationProp<RootStackParamList>
>

type MachineListItem = Machine | CatalogMachine

type LoadingState = Record<AddMachineSourceFilter, boolean>

export default function CustomMachinesScreen() {
    const { t } = useTheme()
    const { t: translate } = useI18n()
    const navigation = useNavigation<Navigation>()
    const [customMachines, setCustomMachines] = useState<Machine[]>([])
    const [catalogMachines, setCatalogMachines] = useState<CatalogMachine[]>([])
    const [source, setSource] = useState<AddMachineSourceFilter>('custom')
    const [query, setQuery] = useState('')
    const [category, setCategory] = useState<AddMachineCategoryFilter>('all')
    const [loading, setLoading] = useState<LoadingState>({
        custom: true,
        catalog: true,
    })
    const [formMachine, setFormMachine] = useState<Machine | null>()
    const [deleteTarget, setDeleteTarget] = useState<Machine | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const refresh = useCallback(async () => {
        const [cachedCustomMachines, cachedCatalogMachines] = await Promise.all(
            [getCachedCustomMachines(), getCachedCatalogMachines()],
        )

        setCustomMachines(cachedCustomMachines)
        setCatalogMachines(cachedCatalogMachines)
        setLoading({
            custom: cachedCustomMachines.length === 0,
            catalog: cachedCatalogMachines.length === 0,
        })

        const [customResult, catalogResult] = await Promise.allSettled([
            loadWorkoutData({ forceSync: true }),
            getCatalogMachines({ forceRefresh: true }),
        ])

        if (customResult.status === 'fulfilled') {
            setCustomMachines(
                Object.values(customResult.value.machines).filter(
                    (machine) => !machine.catalogMachineId,
                ),
            )
        }

        if (catalogResult.status === 'fulfilled') {
            setCatalogMachines(catalogResult.value)
        }

        setLoading({ custom: false, catalog: false })
    }, [])

    useFocusEffect(
        useCallback(() => {
            void refresh()
        }, [refresh]),
    )

    const sourceMachines: MachineListItem[] =
        source === 'custom' ? customMachines : catalogMachines

    const filteredMachines = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()

        return sourceMachines.filter((machine) => {
            const aliases = 'aliases' in machine ? machine.aliases : []

            return (
                (category === 'all' || machine.categoryKey === category) &&
                (!normalizedQuery ||
                    [machine.name, machine.description ?? '', ...aliases]
                        .join(' ')
                        .toLowerCase()
                        .includes(normalizedQuery))
            )
        })
    }, [category, query, sourceMachines])

    const closeForm = () => setFormMachine(undefined)

    const handleDelete = async () => {
        if (!deleteTarget || isDeleting) return

        setIsDeleting(true)
        try {
            await deleteCustomMachine(deleteTarget.id)
            setCustomMachines((current) =>
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

    const isCustomSource = source === 'custom'
    const isLoading = loading[source]
    const emptyMessage = translate(
        sourceMachines.length === 0
            ? isCustomSource
                ? 'customMachines.empty'
                : 'customMachines.catalogEmpty'
            : 'customMachines.noResults',
    )

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
                            catalogCount: catalogMachines.length,
                        })}
                    </Text>
                </LinearGradient>

                <AddMachineSourceFilters
                    sourceFilter={source}
                    onSelectFilter={setSource}
                />

                {isCustomSource && (
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
                )}

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
                            {emptyMessage}
                        </Text>
                    </View>
                ) : (
                    <View style={{ gap: 10 }}>
                        {filteredMachines.map((machine) => (
                            <TouchableOpacity
                                key={machine.id}
                                activeOpacity={isCustomSource ? 0.8 : 1}
                                disabled={!isCustomSource}
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
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            flexWrap: 'wrap',
                                            alignItems: 'center',
                                            gap: 7,
                                            marginTop: 5,
                                        }}
                                    >
                                        <CategoryBadge
                                            categoryKey={machine.categoryKey}
                                        />
                                    </View>
                                    {!!machine.description && (
                                        <Text
                                            numberOfLines={2}
                                            style={{
                                                color: t.textMuted,
                                                fontSize: 11,
                                                lineHeight: 16,
                                                marginTop: 6,
                                            }}
                                        >
                                            {machine.description}
                                        </Text>
                                    )}
                                </View>

                                {isCustomSource && (
                                    <View style={{ flexDirection: 'row' }}>
                                        <TouchableOpacity
                                            accessibilityLabel={translate(
                                                'customMachines.editAccessibility',
                                            )}
                                            onPress={() =>
                                                setFormMachine(
                                                    machine as Machine,
                                                )
                                            }
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
                                            onPress={() =>
                                                setDeleteTarget(
                                                    machine as Machine,
                                                )
                                            }
                                            style={{ padding: 8 }}
                                        >
                                            <Ionicons
                                                name='trash-outline'
                                                size={19}
                                                color='#EF5350'
                                            />
                                        </TouchableOpacity>
                                    </View>
                                )}
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
                        setCustomMachines((current) =>
                            current.map((machine) =>
                                machine.id === updated.id ? updated : machine,
                            ),
                        )
                        return
                    }

                    const created = await createCustomMachine(input)
                    setCustomMachines((current) => [...current, created])
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
