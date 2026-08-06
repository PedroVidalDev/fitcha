import { AppModal } from '@/src/components/AppModal'
import { AddMachineCategoryFilters } from '@/src/components/AddMachineModal/components/AddMachineCategoryFilters'
import { AddMachineSearchField } from '@/src/components/AddMachineModal/components/AddMachineSearchField'
import { AddMachineCategoryFilter } from '@/src/components/AddMachineModal/types'
import { MACHINE_CATEGORIES } from '@/src/constants/categories'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { CatalogMachine } from '@/src/dtos/CatalogMachine'
import { Machine } from '@/src/dtos/Machine'
import { getCatalogMachines } from '@/src/services/catalogMachines'
import { getMyMachines } from '@/src/services/machines'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useState } from 'react'
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import {
    type HistoryTransferModalProps,
    type HistoryTransferTarget,
} from './types'

function isCompatible(source: Machine, target: Machine | CatalogMachine) {
    return (
        source.trackingType === target.trackingType &&
        source.requiresWeight === target.requiresWeight
    )
}

export function HistoryTransferModal(props: HistoryTransferModalProps) {
    const { visible, sourceMachine, onClose, onContinue } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()
    const [targets, setTargets] = useState<HistoryTransferTarget[]>([])
    const [selectedKey, setSelectedKey] = useState<string | null>(null)
    const [query, setQuery] = useState('')
    const [category, setCategory] = useState<AddMachineCategoryFilter>('all')
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        if (!visible) {
            setSelectedKey(null)
            setQuery('')
            setCategory('all')
            setErrorMessage('')
            return
        }

        let active = true
        setIsLoading(true)
        setErrorMessage('')

        void Promise.all([getMyMachines(), getCatalogMachines()])
            .then(([userMachines, catalogMachines]) => {
                if (!active) return

                const linkedCatalogIDs = new Set(
                    userMachines
                        .map((machine) => machine.catalogMachineId)
                        .filter((id): id is string => !!id),
                )
                const userTargets: HistoryTransferTarget[] = userMachines
                    .filter(
                        (machine) =>
                            machine.id !== sourceMachine.id &&
                            isCompatible(sourceMachine, machine),
                    )
                    .map((machine) => ({
                        key: `user:${machine.id}`,
                        kind: 'userMachine',
                        id: machine.id,
                        name: machine.name,
                        description: machine.description,
                        photo: machine.photo,
                        categoryKey: machine.categoryKey,
                        trackingType: machine.trackingType,
                        requiresWeight: machine.requiresWeight,
                        searchTerms: [machine.name, machine.description ?? ''],
                    }))
                const catalogTargets: HistoryTransferTarget[] = catalogMachines
                    .filter(
                        (machine) =>
                            machine.id !== sourceMachine.catalogMachineId &&
                            !linkedCatalogIDs.has(machine.id) &&
                            isCompatible(sourceMachine, machine),
                    )
                    .map((machine) => ({
                        key: `catalog:${machine.id}`,
                        kind: 'catalog',
                        id: machine.id,
                        name: machine.name,
                        description: machine.description,
                        photo: machine.photo,
                        categoryKey: machine.categoryKey,
                        trackingType: machine.trackingType,
                        requiresWeight: machine.requiresWeight,
                        searchTerms: [
                            machine.name,
                            machine.slug,
                            ...(machine.aliases ?? []),
                        ],
                    }))

                setTargets([...userTargets, ...catalogTargets])
            })
            .catch((error) => {
                if (!active) return
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : translate('detail.transfer.loadError'),
                )
            })
            .finally(() => {
                if (active) setIsLoading(false)
            })

        return () => {
            active = false
        }
    }, [sourceMachine, translate, visible])

    const filteredTargets = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()

        return targets.filter((target) => {
            if (category !== 'all' && target.categoryKey !== category) {
                return false
            }

            return (
                !normalizedQuery ||
                target.searchTerms
                    .join(' ')
                    .toLowerCase()
                    .includes(normalizedQuery)
            )
        })
    }, [category, query, targets])

    const selectedTarget = targets.find((target) => target.key === selectedKey)

    return (
        <AppModal
            visible={visible}
            onClose={onClose}
            overlayPadding={10}
            contentStyle={{ minHeight: '88%', maxHeight: '96%' }}
        >
            <ScrollView
                contentContainerStyle={{ paddingBottom: 8 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps='handled'
            >
                <Text
                    style={{
                        color: t.accent,
                        fontSize: 21,
                        fontWeight: '900',
                        marginBottom: 6,
                    }}
                >
                    {translate('detail.transfer.title')}
                </Text>
                <Text
                    style={{
                        color: t.textMuted,
                        fontSize: 13,
                        lineHeight: 19,
                        marginBottom: 18,
                    }}
                >
                    {translate('detail.transfer.subtitle', {
                        name: sourceMachine.name,
                    })}
                </Text>

                <AddMachineCategoryFilters
                    categoryFilter={category}
                    onSelectFilter={setCategory}
                />
                <AddMachineSearchField value={query} onChangeText={setQuery} />

                {isLoading ? (
                    <View style={{ paddingVertical: 38, alignItems: 'center' }}>
                        <ActivityIndicator size='large' color={t.accent} />
                    </View>
                ) : errorMessage ? (
                    <Text
                        style={{
                            color: '#EF5350',
                            textAlign: 'center',
                            paddingVertical: 28,
                            lineHeight: 20,
                        }}
                    >
                        {errorMessage}
                    </Text>
                ) : filteredTargets.length === 0 ? (
                    <Text
                        style={{
                            color: t.textDim,
                            textAlign: 'center',
                            paddingVertical: 28,
                            lineHeight: 20,
                        }}
                    >
                        {translate('detail.transfer.empty')}
                    </Text>
                ) : (
                    <View style={{ gap: 9 }}>
                        {filteredTargets.map((target) => {
                            const isSelected = target.key === selectedKey
                            const categoryLabel = MACHINE_CATEGORIES.find(
                                (item) => item.key === target.categoryKey,
                            )

                            return (
                                <TouchableOpacity
                                    key={target.key}
                                    activeOpacity={0.78}
                                    onPress={() => setSelectedKey(target.key)}
                                    style={{
                                        flexDirection: 'row',
                                        gap: 12,
                                        borderRadius: 14,
                                        borderWidth: 1,
                                        borderColor: isSelected
                                            ? t.accent
                                            : t.border,
                                        backgroundColor: isSelected
                                            ? t.chipBg
                                            : t.inputBg,
                                        padding: 12,
                                    }}
                                >
                                    {target.photo ? (
                                        <Image
                                            source={{ uri: target.photo }}
                                            style={{
                                                width: 56,
                                                height: 56,
                                                borderRadius: 12,
                                            }}
                                        />
                                    ) : (
                                        <View
                                            style={{
                                                width: 56,
                                                height: 56,
                                                borderRadius: 12,
                                                backgroundColor: t.card,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Ionicons
                                                name='barbell-outline'
                                                size={24}
                                                color={t.textDim}
                                            />
                                        </View>
                                    )}

                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={{
                                                color: t.textPrimary,
                                                fontSize: 15,
                                                fontWeight: '800',
                                            }}
                                        >
                                            {target.name}
                                        </Text>
                                        <Text
                                            style={{
                                                color: isSelected
                                                    ? t.accent
                                                    : t.textDim,
                                                fontSize: 11,
                                                fontWeight: '800',
                                                marginTop: 4,
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {translate(
                                                categoryLabel?.labelKey ??
                                                    'categories.peito',
                                            )}
                                            {' · '}
                                            {translate(
                                                target.kind === 'userMachine'
                                                    ? 'detail.transfer.mineBadge'
                                                    : 'detail.transfer.catalogBadge',
                                            )}
                                        </Text>
                                        {target.description ? (
                                            <Text
                                                numberOfLines={2}
                                                style={{
                                                    color: t.textMuted,
                                                    fontSize: 12,
                                                    lineHeight: 17,
                                                    marginTop: 5,
                                                }}
                                            >
                                                {target.description}
                                            </Text>
                                        ) : null}
                                    </View>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                )}
            </ScrollView>

            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    gap: 12,
                    marginTop: 16,
                }}
            >
                <TouchableOpacity onPress={onClose} style={{ padding: 12 }}>
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 15,
                            fontWeight: '600',
                        }}
                    >
                        {translate('common.actions.cancel')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    disabled={!selectedTarget}
                    activeOpacity={0.76}
                    onPress={() => {
                        if (selectedTarget) onContinue(selectedTarget)
                    }}
                    style={{ opacity: selectedTarget ? 1 : 0.45 }}
                >
                    <LinearGradient
                        colors={t.gradientAccent}
                        style={{
                            paddingHorizontal: 22,
                            paddingVertical: 12,
                            borderRadius: 12,
                        }}
                    >
                        <Text
                            style={{
                                color: t.btnColor,
                                fontSize: 15,
                                fontWeight: '800',
                            }}
                        >
                            {translate('common.actions.continue')}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </AppModal>
    )
}
