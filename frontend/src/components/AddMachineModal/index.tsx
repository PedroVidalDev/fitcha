import { getCatalogMachines } from '@/src/services/catalogMachines'
import { useEffect, useMemo, useState } from 'react'
import { ScrollView } from 'react-native'
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
    type AddMachineCatalogMachine,
    type AddMachineModalProps,
} from './types'

export function AddMachineModal(props: AddMachineModalProps) {
    const { visible, onClose, onAdd } = props
    const [machines, setMachines] = useState<AddMachineCatalogMachine[]>([])
    const [query, setQuery] = useState('')
    const [categoryFilter, setCategoryFilter] =
        useState<AddMachineCategoryFilter>('all')
    const [selectedMachineId, setSelectedMachineId] = useState<string | null>(
        null,
    )
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!visible) return

        let mounted = true
        setIsLoading(true)

        void getCatalogMachines()
            .then((response) => {
                if (!mounted) return
                setMachines(response)
            })
            .finally(() => {
                if (!mounted) return
                setIsLoading(false)
            })

        return () => {
            mounted = false
        }
    }, [visible])

    const filteredMachines = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()

        return machines.filter((machine) => {
            if (
                categoryFilter !== 'all' &&
                machine.categoryKey !== categoryFilter
            ) {
                return false
            }

            if (!normalizedQuery) return true

            const haystack = [
                machine.name,
                machine.slug,
                ...(machine.aliases ?? []),
            ]
                .join(' ')
                .toLowerCase()

            return haystack.includes(normalizedQuery)
        })
    }, [categoryFilter, machines, query])

    const handleClose = () => {
        setQuery('')
        setCategoryFilter('all')
        setSelectedMachineId(null)
        onClose()
    }

    const handleAdd = () => {
        if (!selectedMachineId) return
        const selectedMachine = machines.find(
            (machine) => machine.id === selectedMachineId,
        )
        if (!selectedMachine) return

        onAdd(selectedMachine)
        handleClose()
    }

    return (
        <AppModal
            visible={visible}
            onClose={handleClose}
            overlayPadding={10}
            contentStyle={{ minHeight: '88%', maxHeight: '96%' }}
        >
            <ScrollView
                contentContainerStyle={{ paddingBottom: 8 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
                keyboardShouldPersistTaps='handled'
            >
                <AddMachineModalHeader />

                <AddMachineCategoryFilters
                    categoryFilter={categoryFilter}
                    onSelectFilter={setCategoryFilter}
                />

                <AddMachineSearchField value={query} onChangeText={setQuery} />

                {isLoading ? (
                    <AddMachineLoadingState />
                ) : filteredMachines.length === 0 ? (
                    <AddMachineEmptyState />
                ) : (
                    <AddMachineMachineList
                        machines={filteredMachines}
                        selectedMachineId={selectedMachineId}
                        onSelectMachine={setSelectedMachineId}
                    />
                )}
            </ScrollView>

            <AddMachineFooterActions
                canAdd={!!selectedMachineId}
                onClose={handleClose}
                onAdd={handleAdd}
            />
        </AppModal>
    )
}
