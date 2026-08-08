import { CustomMachineFormModal } from '@/src/components/CustomMachineFormModal'
import { Machine } from '@/src/dtos/Machine'
import {
    getCachedCatalogMachines,
    getCatalogMachines,
} from '@/src/services/catalogMachines'
import {
    createCustomMachine,
    getCachedWorkoutData,
} from '@/src/services/workoutData'
import { Ionicons } from '@expo/vector-icons'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useI18n } from '../../contexts/I18nContext'
import { useTheme } from '../../contexts/ThemeContext'
import { CatalogMachine } from '../../dtos/CatalogMachine'
import { AppModal } from '../AppModal'
import { AddMachineCategoryFilters } from './components/AddMachineCategoryFilters'
import { AddMachineEmptyState } from './components/AddMachineEmptyState'
import { AddMachineFooterActions } from './components/AddMachineFooterActions'
import { AddMachineLoadingState } from './components/AddMachineLoadingState'
import { AddMachineMachineList } from './components/AddMachineMachineList'
import { AddMachineModalHeader } from './components/AddMachineModalHeader'
import { AddMachineSearchField } from './components/AddMachineSearchField'
import {
    type AddMachineCategoryFilter,
    type AddMachineModalProps,
    type AddMachineOption,
} from './types'

function toCatalogOption(machine: CatalogMachine): AddMachineOption {
    return {
        key: `catalog:${machine.id}`,
        kind: 'catalog',
        id: machine.id,
        name: machine.name,
        description: machine.description,
        photo: machine.photo,
        categoryKey: machine.categoryKey,
        substitutionGroup: machine.substitutionGroup,
        trackingType: machine.trackingType,
        requiresWeight: machine.requiresWeight,
        searchTerms: [machine.name, machine.slug, ...(machine.aliases ?? [])],
    }
}

function toCustomOption(machine: Machine): AddMachineOption {
    return {
        key: `custom:${machine.id}`,
        kind: 'custom',
        id: machine.id,
        name: machine.name,
        description: machine.description,
        photo: machine.photo,
        categoryKey: machine.categoryKey,
        trackingType: machine.trackingType,
        requiresWeight: machine.requiresWeight,
        searchTerms: [machine.name, machine.description ?? ''],
    }
}

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
    const [catalogMachines, setCatalogMachines] = useState<CatalogMachine[]>([])
    const [customMachines, setCustomMachines] = useState<Machine[]>([])
    const [query, setQuery] = useState('')
    const [categoryFilter, setCategoryFilter] =
        useState<AddMachineCategoryFilter>('all')
    const [selectedMachineKey, setSelectedMachineKey] = useState<string | null>(
        null,
    )
    const [isLoading, setIsLoading] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [isCustomFormVisible, setIsCustomFormVisible] = useState(false)

    useEffect(() => {
        if (!visible) return

        let mounted = true
        setIsLoading(true)
        setErrorMessage('')

        void (async () => {
            try {
                const [cachedCatalog, workoutData] = await Promise.all([
                    getCachedCatalogMachines(),
                    getCachedWorkoutData(),
                ])
                if (!mounted) return

                setCustomMachines(
                    Object.values(workoutData.machines).filter(
                        (machine) => !machine.catalogMachineId,
                    ),
                )
                if (cachedCatalog.length > 0) {
                    setCatalogMachines(cachedCatalog)
                    setIsLoading(false)
                }

                const response = await getCatalogMachines()
                if (mounted) setCatalogMachines(response)
            } catch {
                if (mounted) setCatalogMachines([])
            } finally {
                if (mounted) setIsLoading(false)
            }
        })()

        return () => {
            mounted = false
        }
    }, [visible])

    const options = useMemo(() => {
        const customOptions = substitutionGroup
            ? []
            : customMachines
                  .filter(
                      (machine) => !excludedUserMachineIds.includes(machine.id),
                  )
                  .map(toCustomOption)
        const catalogOptions = catalogMachines
            .filter(
                (machine) =>
                    (!substitutionGroup ||
                        machine.substitutionGroup === substitutionGroup) &&
                    !excludedMachineIds.includes(machine.id),
            )
            .map(toCatalogOption)

        return { customOptions, catalogOptions }
    }, [
        catalogMachines,
        customMachines,
        excludedMachineIds,
        excludedUserMachineIds,
        substitutionGroup,
    ])

    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()
        const filter = (machine: AddMachineOption) =>
            (categoryFilter === 'all' ||
                machine.categoryKey === categoryFilter) &&
            (!normalizedQuery ||
                machine.searchTerms
                    .join(' ')
                    .toLowerCase()
                    .includes(normalizedQuery))

        return {
            customOptions: options.customOptions.filter(filter),
            catalogOptions: options.catalogOptions.filter(filter),
        }
    }, [categoryFilter, options, query])

    const allOptions = [...options.customOptions, ...options.catalogOptions]
    const selectedMachine = allOptions.find(
        (machine) => machine.key === selectedMachineKey,
    )
    const hasResults =
        filteredOptions.customOptions.length > 0 ||
        filteredOptions.catalogOptions.length > 0

    const resetAndClose = () => {
        setQuery('')
        setCategoryFilter('all')
        setSelectedMachineKey(null)
        setIsCustomFormVisible(false)
        setErrorMessage('')
        onClose()
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
                            onSelectFilter={setCategoryFilter}
                        />
                    )}
                    <AddMachineSearchField
                        value={query}
                        onChangeText={setQuery}
                    />

                    {isLoading ? (
                        <AddMachineLoadingState />
                    ) : !hasResults ? (
                        <AddMachineEmptyState />
                    ) : (
                        <View style={{ gap: 16 }}>
                            {filteredOptions.customOptions.length > 0 ? (
                                <View style={{ gap: 9 }}>
                                    <Text
                                        style={{
                                            color: t.accent,
                                            fontSize: 11,
                                            fontWeight: '900',
                                            textTransform: 'uppercase',
                                            letterSpacing: 1.1,
                                        }}
                                    >
                                        {translate(
                                            'customMachines.pickerMyMachines',
                                        )}
                                    </Text>
                                    <AddMachineMachineList
                                        machines={filteredOptions.customOptions}
                                        selectedMachineId={selectedMachineKey}
                                        onSelectMachine={setSelectedMachineKey}
                                    />
                                </View>
                            ) : null}

                            {filteredOptions.catalogOptions.length > 0 ? (
                                <View style={{ gap: 9 }}>
                                    <Text
                                        style={{
                                            color: t.textDim,
                                            fontSize: 11,
                                            fontWeight: '900',
                                            textTransform: 'uppercase',
                                            letterSpacing: 1.1,
                                        }}
                                    >
                                        {translate(
                                            'customMachines.pickerCatalog',
                                        )}
                                    </Text>
                                    <AddMachineMachineList
                                        machines={
                                            filteredOptions.catalogOptions
                                        }
                                        selectedMachineId={selectedMachineKey}
                                        onSelectMachine={setSelectedMachineKey}
                                    />
                                </View>
                            ) : null}
                        </View>
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
                    const machine = await createCustomMachine(input)
                    setCustomMachines((current) => [...current, machine])
                    await onAdd(toCustomOption(machine))
                    resetAndClose()
                }}
            />
        </Fragment>
    )
}
