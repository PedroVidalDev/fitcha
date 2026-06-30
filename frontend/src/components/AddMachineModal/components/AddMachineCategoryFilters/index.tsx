import { MACHINE_CATEGORIES } from '@/src/constants/categories'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, View } from 'react-native'
import { AddMachineCategoryChip } from './components/AddMachineCategoryChip'
import { type AddMachineCategoryFiltersProps } from './types'

export function AddMachineCategoryFilters(
    props: AddMachineCategoryFiltersProps,
) {
    const { categoryFilter, onSelectFilter } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

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
                <AddMachineCategoryChip
                    label={translate('addMachine.allCategories')}
                    active={categoryFilter === 'all'}
                    activeColor={t.accent}
                    onPress={() => onSelectFilter('all')}
                />

                {MACHINE_CATEGORIES.map((category) => (
                    <AddMachineCategoryChip
                        key={category.key}
                        label={translate(category.labelKey)}
                        active={categoryFilter === category.key}
                        activeColor={category.color}
                        onPress={() => onSelectFilter(category.key)}
                    />
                ))}
            </View>
        </>
    )
}
