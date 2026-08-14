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
import { PaginationControls } from '@/src/components/PaginationControls'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { CatalogMachine } from '@/src/dtos/CatalogMachine'
import { Machine } from '@/src/dtos/Machine'
import { MainTabParamList, RootStackParamList } from '@/src/router/types'
import { searchCatalogMachines } from '@/src/services/catalogMachines'
import {
    createCustomMachineData,
    deleteCustomMachineData,
    searchMachineData,
    updateCustomMachineData,
} from '@/src/services/machineData'
import { Ionicons } from '@expo/vector-icons'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import {
    CompositeNavigationProp,
    useFocusEffect,
    useNavigation,
} from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useRef, useState } from 'react'
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

const PAGE_LIMIT = 20

export default function CustomMachinesScreen() {
    const { t } = useTheme()
    const { t: translate } = useI18n()
    const navigation = useNavigation<Navigation>()
    const [machines, setMachines] = useState<MachineListItem[]>([])
    const [source, setSource] = useState<AddMachineSourceFilter>('custom')
    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [category, setCategory] = useState<AddMachineCategoryFilter>('all')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const [formMachine, setFormMachine] = useState<Machine | null>()
    const [deleteTarget, setDeleteTarget] = useState<Machine | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const requestIdRef = useRef(0)

    useEffect(() => {
        const timeoutId = setTimeout(() => setDebouncedQuery(query.trim()), 300)
        return () => clearTimeout(timeoutId)
    }, [query])

    const loadPage = useCallback(
        async (targetPage: number) => {
            const requestId = ++requestIdRef.current
            setIsLoading(true)
            setLoadError('')

            try {
                const filters = {
                    q: debouncedQuery || undefined,
                    categoryKey: category === 'all' ? undefined : category,
                    page: targetPage,
                    limit: PAGE_LIMIT,
                }
                const response =
                    source === 'custom'
                        ? await searchMachineData({
                              ...filters,
                              source: 'custom',
                          })
                        : await searchCatalogMachines(filters)

                if (requestId !== requestIdRef.current) return
                setMachines(response.items)
                setPage(response.page)
                setTotalPages(response.totalPages)
            } catch (error) {
                if (requestId !== requestIdRef.current) return
                setMachines([])
                setTotalPages(0)
                setLoadError(
                    error instanceof Error
                        ? error.message
                        : translate('services.machines.loadError'),
                )
            } finally {
                if (requestId === requestIdRef.current) setIsLoading(false)
            }
        },
        [category, debouncedQuery, source, translate],
    )

    useFocusEffect(
        useCallback(() => {
            void loadPage(1)
            return () => {
                requestIdRef.current += 1
            }
        }, [loadPage]),
    )

    const closeForm = () => setFormMachine(undefined)

    const handleDelete = async () => {
        if (!deleteTarget || isDeleting) return

        setIsDeleting(true)
        try {
            await deleteCustomMachineData(deleteTarget.id)
            const nextPage = machines.length === 1 && page > 1 ? page - 1 : page
            await loadPage(nextPage)
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
    const emptyMessage = translate(
        !query.trim() && category === 'all'
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
                        {translate('customMachines.summary')}
                    </Text>
                </LinearGradient>

                <AddMachineSourceFilters
                    sourceFilter={source}
                    onSelectFilter={(nextSource) => {
                        setSource(nextSource)
                        setPage(1)
                    }}
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
                    onSelectFilter={(nextCategory) => {
                        setCategory(nextCategory)
                        setPage(1)
                    }}
                />
                <AddMachineSearchField value={query} onChangeText={setQuery} />

                {isLoading ? (
                    <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                        <ActivityIndicator size='large' color={t.accent} />
                    </View>
                ) : loadError ? (
                    <Text
                        style={{
                            color: '#EF5350',
                            textAlign: 'center',
                            paddingVertical: 30,
                        }}
                    >
                        {loadError}
                    </Text>
                ) : machines.length === 0 ? (
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
                        {machines.map((machine) => (
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
                        <PaginationControls
                            page={page}
                            totalPages={totalPages}
                            disabled={isLoading}
                            onChangePage={(nextPage) => void loadPage(nextPage)}
                        />
                    </View>
                )}
            </ScrollView>

            <CustomMachineFormModal
                visible={formMachine !== undefined}
                machine={formMachine}
                onClose={closeForm}
                onSubmit={async (input) => {
                    if (formMachine) {
                        await updateCustomMachineData(formMachine.id, input)
                        await loadPage(page)
                        return
                    }

                    await createCustomMachineData(input)
                    await loadPage(1)
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
