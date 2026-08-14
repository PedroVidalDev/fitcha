import { CustomMachineFormModal } from '@/src/components/CustomMachineFormModal'
import { PaginationControls } from '@/src/components/PaginationControls'
import { searchCatalogMachines } from '@/src/services/catalogMachines'
import {
    createCustomMachineData,
    searchMachineData,
} from '@/src/services/machineData'
import { Ionicons } from '@expo/vector-icons'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useI18n } from '../../contexts/I18nContext'
import { useTheme } from '../../contexts/ThemeContext'
import { AppModal } from '../AppModal'
import { AddMachineCategoryFilters } from './components/AddMachineCategoryFilters'
import { AddMachineEmptyState } from './components/AddMachineEmptyState'
import { AddMachineFooterActions } from './components/AddMachineFooterActions'
import { AddMachineLoadingState } from './components/AddMachineLoadingState'
import { AddMachineMachineList } from './components/AddMachineMachineList'
import { AddMachineModalHeader } from './components/AddMachineModalHeader'
import { AddMachineSearchField } from './components/AddMachineSearchField'
import { AddMachineSourceFilters } from './components/AddMachineSourceFilters'
import {
    type AddMachineCategoryFilter,
    type AddMachineModalProps,
    type AddMachineOption,
    type AddMachineSourceFilter,
} from './types'
import { toCatalogOption, toCustomOption } from './helpers'

const PAGE_LIMIT = 20

export function AddMachineModal(props: AddMachineModalProps) {
    const {
        visible,
        onClose,
        onAdd,
        substitutionGroup,
        excludedMachineIds = [],
        excludedUserMachineIds = [],
        hideCategoryFilters = false,
        titleKey,
        actionLabelKey,
    } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()
    const [options, setOptions] = useState<AddMachineOption[]>([])
    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [categoryFilter, setCategoryFilter] =
        useState<AddMachineCategoryFilter>('all')
    const [sourceFilter, setSourceFilter] = useState<AddMachineSourceFilter>(
        substitutionGroup ? 'catalog' : 'custom',
    )
    const [selectedMachineKey, setSelectedMachineKey] = useState<string | null>(
        null,
    )
    const [isLoading, setIsLoading] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [isCustomFormVisible, setIsCustomFormVisible] = useState(false)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const requestIdRef = useRef(0)
    const excludedCatalogIDs = excludedMachineIds.join(',')
    const excludedUserMachineIDs = excludedUserMachineIds.join(',')

    useEffect(() => {
        const timeoutId = setTimeout(() => setDebouncedQuery(query.trim()), 300)
        return () => clearTimeout(timeoutId)
    }, [query])

    useEffect(() => {
        if (!visible) return
        setSourceFilter(substitutionGroup ? 'catalog' : 'custom')
        setPage(1)
    }, [substitutionGroup, visible])

    const loadPage = useCallback(
        async (targetPage: number) => {
            if (!visible || isCustomFormVisible) return

            const requestId = ++requestIdRef.current
            setIsLoading(true)
            setErrorMessage('')
            setSelectedMachineKey(null)

            try {
                const commonFilters = {
                    q: debouncedQuery || undefined,
                    categoryKey:
                        categoryFilter === 'all' ? undefined : categoryFilter,
                    page: targetPage,
                    limit: PAGE_LIMIT,
                }
                let nextOptions: AddMachineOption[]
                let nextPage: number
                let nextTotalPages: number

                if (sourceFilter === 'custom') {
                    const response = await searchMachineData({
                        ...commonFilters,
                        source: 'custom',
                        excludeIds: excludedUserMachineIDs || undefined,
                    })
                    nextOptions = response.items.map(toCustomOption)
                    nextPage = response.page
                    nextTotalPages = response.totalPages
                } else {
                    const response = await searchCatalogMachines({
                        ...commonFilters,
                        substitutionGroup,
                        excludeIds: excludedCatalogIDs || undefined,
                    })
                    nextOptions = response.items.map(toCatalogOption)
                    nextPage = response.page
                    nextTotalPages = response.totalPages
                }

                if (requestId !== requestIdRef.current) return
                setOptions(nextOptions)
                setPage(nextPage)
                setTotalPages(nextTotalPages)
            } catch (error) {
                if (requestId !== requestIdRef.current) return
                setOptions([])
                setTotalPages(0)
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : translate('services.machines.loadError'),
                )
            } finally {
                if (requestId === requestIdRef.current) setIsLoading(false)
            }
        },
        [
            categoryFilter,
            debouncedQuery,
            excludedCatalogIDs,
            excludedUserMachineIDs,
            isCustomFormVisible,
            sourceFilter,
            substitutionGroup,
            translate,
            visible,
        ],
    )

    useEffect(() => {
        if (!visible) return
        void loadPage(1)
        return () => {
            requestIdRef.current += 1
        }
    }, [loadPage, visible])

    const selectedMachine = options.find(
        (machine) => machine.key === selectedMachineKey,
    )
    const hasResults = options.length > 0

    const resetAndClose = () => {
        setQuery('')
        setCategoryFilter('all')
        setSourceFilter(substitutionGroup ? 'catalog' : 'custom')
        setSelectedMachineKey(null)
        setOptions([])
        setPage(1)
        setTotalPages(0)
        setIsCustomFormVisible(false)
        setErrorMessage('')
        onClose()
    }

    const handleSelectSourceFilter = (nextFilter: AddMachineSourceFilter) => {
        if (nextFilter === sourceFilter) return

        setSourceFilter(nextFilter)
        setSelectedMachineKey(null)
        setPage(1)
        setErrorMessage('')
    }

    const handleAdd = async () => {
        if (!selectedMachine || isAdding) return

        setIsAdding(true)
        setErrorMessage('')
        try {
            await onAdd(selectedMachine)
            resetAndClose()
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : translate('services.workouts.addMachineError'),
            )
        } finally {
            setIsAdding(false)
        }
    }

    return (
        <Fragment>
            <AppModal
                visible={visible && !isCustomFormVisible}
                onClose={resetAndClose}
                overlayPadding={10}
                contentStyle={{ minHeight: '88%', maxHeight: '96%' }}
            >
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 8 }}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    keyboardShouldPersistTaps='handled'
                >
                    <AddMachineModalHeader titleKey={titleKey} />

                    {!substitutionGroup ? (
                        <AddMachineSourceFilters
                            sourceFilter={sourceFilter}
                            onSelectFilter={handleSelectSourceFilter}
                        />
                    ) : null}

                    {!substitutionGroup && sourceFilter === 'custom' ? (
                        <TouchableOpacity
                            activeOpacity={0.78}
                            onPress={() => setIsCustomFormVisible(true)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 11,
                                borderRadius: 14,
                                borderWidth: 1,
                                borderColor: t.accent,
                                backgroundColor: t.chipBg,
                                padding: 13,
                                marginBottom: 15,
                            }}
                        >
                            <Ionicons
                                name='add-circle-outline'
                                size={23}
                                color={t.accent}
                            />
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        color: t.textPrimary,
                                        fontSize: 14,
                                        fontWeight: '900',
                                    }}
                                >
                                    {translate('customMachines.createAction')}
                                </Text>
                                <Text
                                    style={{
                                        color: t.textDim,
                                        fontSize: 12,
                                        marginTop: 3,
                                    }}
                                >
                                    {translate(
                                        'customMachines.createFromPickerHint',
                                    )}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ) : null}

                    {!hideCategoryFilters && (
                        <AddMachineCategoryFilters
                            categoryFilter={categoryFilter}
                            onSelectFilter={(nextCategory) => {
                                setCategoryFilter(nextCategory)
                                setSelectedMachineKey(null)
                                setPage(1)
                            }}
                        />
                    )}
                    <AddMachineSearchField
                        value={query}
                        onChangeText={(value) => {
                            setQuery(value)
                            setSelectedMachineKey(null)
                            setPage(1)
                        }}
                    />

                    {isLoading ? (
                        <AddMachineLoadingState />
                    ) : !hasResults ? (
                        <AddMachineEmptyState sourceFilter={sourceFilter} />
                    ) : (
                        <>
                            <AddMachineMachineList
                                machines={options}
                                selectedMachineId={selectedMachineKey}
                                onSelectMachine={setSelectedMachineKey}
                            />
                            <PaginationControls
                                page={page}
                                totalPages={totalPages}
                                disabled={isLoading}
                                onChangePage={(nextPage) =>
                                    void loadPage(nextPage)
                                }
                            />
                        </>
                    )}
                </ScrollView>

                {errorMessage ? (
                    <Text
                        style={{
                            color: '#EF5350',
                            fontSize: 12,
                            lineHeight: 17,
                            textAlign: 'center',
                            marginTop: 10,
                        }}
                    >
                        {errorMessage}
                    </Text>
                ) : null}

                <AddMachineFooterActions
                    canAdd={!!selectedMachine && !isAdding}
                    onClose={resetAndClose}
                    onAdd={() => void handleAdd()}
                    actionLabelKey={actionLabelKey}
                />
            </AppModal>

            <CustomMachineFormModal
                visible={visible && isCustomFormVisible}
                onClose={() => setIsCustomFormVisible(false)}
                onSubmit={async (input) => {
                    const machine = await createCustomMachineData(input)
                    await onAdd(toCustomOption(machine))
                    resetAndClose()
                }}
            />
        </Fragment>
    )
}
