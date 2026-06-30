import {
    MACHINE_CATEGORIES,
    type MachineCategoryKey,
} from '@/src/constants/categories'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, TouchableOpacity, View } from 'react-native'
import { type AddMachineCategoryFiltersProps } from './types'

export function AddMachineCategoryFilters(
    props: AddMachineCategoryFiltersProps,
) {
    const { categoryFilter, onSelectFilter } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    const renderChip = (
        label: string,
        active: boolean,
        onPress: () => void,
        activeColor = t.accent,
        key?: MachineCategoryKey | 'all',
    ) => (
        <TouchableOpacity
            key={key ?? label}
            onPress={onPress}
            activeOpacity={0.7}
            style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: active ? activeColor : t.inputBg,
                borderWidth: 0.5,
                borderColor: active ? activeColor : t.border,
            }}
        >
            <Text
                style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: active ? t.btnColor : t.textMuted,
                }}
            >
                {label}
            </Text>
        </TouchableOpacity>
    )

    return (
        <>
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
                {renderChip(
                    translate('addMachine.allCategories'),
                    categoryFilter === 'all',
                    () => onSelectFilter('all'),
                    t.accent,
                    'all',
                )}

                {MACHINE_CATEGORIES.map((category) =>
                    renderChip(
                        translate(category.labelKey),
                        categoryFilter === category.key,
                        () => onSelectFilter(category.key),
                        category.color,
                        category.key,
                    ),
                )}
            </View>
        </>
    )
}
