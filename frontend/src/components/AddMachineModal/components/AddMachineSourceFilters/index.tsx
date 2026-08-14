import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, TouchableOpacity, View } from 'react-native'
import { type AddMachineSourceFiltersProps } from './types'
import { FILTERS } from './consts'

export function AddMachineSourceFilters(props: AddMachineSourceFiltersProps) {
    const { sourceFilter, onSelectFilter } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <View
            accessibilityRole='tablist'
            style={{
                flexDirection: 'row',
                gap: 6,
                padding: 5,
                marginBottom: 15,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: t.border,
                backgroundColor: t.inputBg,
            }}
        >
            {FILTERS.map((filter) => {
                const isActive = sourceFilter === filter.key

                return (
                    <TouchableOpacity
                        key={filter.key}
                        activeOpacity={0.78}
                        accessibilityRole='tab'
                        accessibilityState={{ selected: isActive }}
                        onPress={() => onSelectFilter(filter.key)}
                        style={{
                            flex: 1,
                            minHeight: 42,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 10,
                            backgroundColor: isActive
                                ? t.accent
                                : 'transparent',
                        }}
                    >
                        <Text
                            style={{
                                color: isActive ? t.btnColor : t.textMuted,
                                fontSize: 13,
                                fontWeight: '900',
                                textAlign: 'center',
                            }}
                        >
                            {translate(filter.labelKey)}
                        </Text>
                    </TouchableOpacity>
                )
            })}
        </View>
    )
}
