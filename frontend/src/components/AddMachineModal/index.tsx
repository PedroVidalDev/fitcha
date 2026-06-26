import { CatalogMachine } from '@/src/dtos/CatalogMachine'
import { getCatalogMachines } from '@/src/services/catalogMachines'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useState } from 'react'
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import {
    MACHINE_CATEGORIES,
    MachineCategoryKey,
} from '../../constants/categories'
import { useI18n } from '../../contexts/I18nContext'
import { useTheme } from '../../contexts/ThemeContext'
import { AppModal } from '../AppModal'
import { AddMachineModalProps } from './types'

type CategoryFilter = MachineCategoryKey | 'all'

export function AddMachineModal(props: AddMachineModalProps) {
    const { visible, onClose, onAdd } = props

    const { t } = useTheme()
    const { t: translate } = useI18n()

    const [machines, setMachines] = useState<CatalogMachine[]>([])
    const [query, setQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
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
        onAdd(selectedMachineId)
        handleClose()
    }

    const btnColor = t.mode === 'dark' ? '#0d0500' : '#FFF'

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
                <Text
                    style={{
                        color: t.accent,
                        fontSize: 20,
                        fontWeight: '800',
                        marginBottom: 18,
                    }}
                >
                    {translate('addMachine.title')}
                </Text>

                <Text
                    style={{
                        color: t.textDim,
                        fontSize: 11,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        marginBottom: 8,
                    }}
                >
                    {translate('addMachine.categoryLabel')}
                </Text>
                <View
                    style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 8,
                        marginBottom: 16,
                    }}
                >
                    <TouchableOpacity
                        onPress={() => setCategoryFilter('all')}
                        activeOpacity={0.7}
                        style={{
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 10,
                            backgroundColor:
                                categoryFilter === 'all' ? t.accent : t.inputBg,
                            borderWidth: 0.5,
                            borderColor:
                                categoryFilter === 'all' ? t.accent : t.border,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 13,
                                fontWeight: '700',
                                color:
                                    categoryFilter === 'all'
                                        ? '#FFF'
                                        : t.textMuted,
                            }}
                        >
                            {translate('addMachine.allCategories')}
                        </Text>
                    </TouchableOpacity>

                    {MACHINE_CATEGORIES.map((cat) => {
                        const active = categoryFilter === cat.key
                        return (
                            <TouchableOpacity
                                key={cat.key}
                                onPress={() => setCategoryFilter(cat.key)}
                                activeOpacity={0.7}
                                style={{
                                    paddingHorizontal: 14,
                                    paddingVertical: 8,
                                    borderRadius: 10,
                                    backgroundColor: active
                                        ? cat.color
                                        : t.inputBg,
                                    borderWidth: 0.5,
                                    borderColor: active ? cat.color : t.border,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: '700',
                                        color: active ? '#FFF' : t.textMuted,
                                    }}
                                >
                                    {translate(cat.labelKey)}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>

                <Text
                    style={{
                        color: t.textDim,
                        fontSize: 11,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        marginBottom: 6,
                    }}
                >
                    {translate('addMachine.searchLabel')}
                </Text>
                <TextInput
                    style={{
                        backgroundColor: t.inputBg,
                        borderRadius: 12,
                        padding: 14,
                        color: t.textPrimary,
                        fontSize: 16,
                        borderWidth: 0.5,
                        borderColor: t.border,
                        marginBottom: 16,
                    }}
                    placeholder={translate('addMachine.searchPlaceholder')}
                    placeholderTextColor={t.textDim}
                    value={query}
                    onChangeText={setQuery}
                    autoFocus
                />

                {isLoading ? (
                    <View
                        style={{
                            paddingVertical: 32,
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >
                        <ActivityIndicator size='small' color={t.accent} />
                        <Text style={{ color: t.textMuted, fontSize: 13 }}>
                            {translate('addMachine.loading')}
                        </Text>
                    </View>
                ) : filteredMachines.length === 0 ? (
                    <View
                        style={{
                            borderRadius: 14,
                            borderWidth: 0.5,
                            borderColor: t.border,
                            backgroundColor: t.inputBg,
                            padding: 18,
                        }}
                    >
                        <Text
                            style={{
                                color: t.textPrimary,
                                fontSize: 15,
                                fontWeight: '700',
                            }}
                        >
                            {translate('addMachine.emptyTitle')}
                        </Text>
                        <Text
                            style={{
                                color: t.textMuted,
                                fontSize: 13,
                                lineHeight: 19,
                                marginTop: 6,
                            }}
                        >
                            {translate('addMachine.emptyMessage')}
                        </Text>
                    </View>
                ) : (
                    <View style={{ gap: 10 }}>
                        {filteredMachines.map((machine) => {
                            const isSelected = selectedMachineId === machine.id

                            return (
                                <TouchableOpacity
                                    key={machine.id}
                                    activeOpacity={0.78}
                                    onPress={() =>
                                        setSelectedMachineId(machine.id)
                                    }
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
                                    {machine.photo ? (
                                        <Image
                                            source={{ uri: machine.photo }}
                                            style={{
                                                width: 56,
                                                height: 56,
                                                borderRadius: 12,
                                            }}
                                            resizeMode='cover'
                                        />
                                    ) : (
                                        <View
                                            style={{
                                                width: 56,
                                                height: 56,
                                                borderRadius: 12,
                                                backgroundColor: t.card,
                                                borderWidth: 0.5,
                                                borderColor: t.border,
                                            }}
                                        />
                                    )}

                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={{
                                                color: t.textPrimary,
                                                fontSize: 15,
                                                fontWeight: '800',
                                            }}
                                        >
                                            {machine.name}
                                        </Text>
                                        <Text
                                            style={{
                                                color: isSelected
                                                    ? t.accent
                                                    : t.textDim,
                                                fontSize: 12,
                                                fontWeight: '700',
                                                marginTop: 4,
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {translate(
                                                MACHINE_CATEGORIES.find(
                                                    (item) =>
                                                        item.key ===
                                                        machine.categoryKey,
                                                )?.labelKey ??
                                                    'categories.peito',
                                            )}
                                        </Text>
                                        {!!machine.description && (
                                            <Text
                                                style={{
                                                    color: t.textMuted,
                                                    fontSize: 12,
                                                    lineHeight: 18,
                                                    marginTop: 6,
                                                }}
                                                numberOfLines={2}
                                            >
                                                {machine.description}
                                            </Text>
                                        )}
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
                    marginTop: 18,
                }}
            >
                <TouchableOpacity onPress={handleClose} style={{ padding: 12 }}>
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
                    onPress={handleAdd}
                    activeOpacity={0.75}
                    disabled={!selectedMachineId}
                    style={{ opacity: selectedMachineId ? 1 : 0.5 }}
                >
                    <LinearGradient
                        colors={t.gradientAccent}
                        style={{
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            borderRadius: 12,
                        }}
                    >
                        <Text
                            style={{
                                color: btnColor,
                                fontSize: 15,
                                fontWeight: '800',
                            }}
                        >
                            {translate('common.actions.add')}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </AppModal>
    )
}
