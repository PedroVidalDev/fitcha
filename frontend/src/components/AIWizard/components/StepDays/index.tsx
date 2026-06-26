import { Ionicons } from '@expo/vector-icons'
import {
    DAY_LABEL_KEYS,
    DAY_SHORT_LABEL_KEYS,
} from '@/src/constants/categories'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { StepDaysProps } from './types'

export const StepDays = (props: StepDaysProps) => {
    const { value, onChange } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()
    const btnColor = t.mode === 'dark' ? '#0d0500' : '#FFF'

    const toggleDay = (dayIndex: number) => {
        const isSelected = value.includes(dayIndex)

        if (isSelected) {
            onChange(value.filter((currentDay) => currentDay !== dayIndex))
            return
        }

        onChange([...value, dayIndex].sort((a, b) => a - b))
    }

    return (
        <View>
            <Text
                style={{
                    color: t.textMuted,
                    fontSize: 13,
                    lineHeight: 19,
                    marginBottom: 16,
                }}
            >
                {translate('aiWizard.days.description')}
            </Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={{ gap: 8, paddingRight: 8 }}
            >
                {DAY_LABEL_KEYS.map((labelKey, dayIndex) => {
                    const label = translate(labelKey)
                    const active = value.includes(dayIndex)
                    const cardBackgroundColor = active ? t.accent : t.inputBg
                    const cardBorderColor = active ? t.accent : t.border
                    const textColor = active ? btnColor : t.textPrimary
                    const statusIconColor = active ? btnColor : t.textDim

                    return (
                        <TouchableOpacity
                            key={label}
                            onPress={() => toggleDay(dayIndex)}
                            activeOpacity={0.7}
                            style={{
                                width: 108,
                                minHeight: 82,
                                paddingVertical: 12,
                                paddingHorizontal: 12,
                                borderRadius: 16,
                                backgroundColor: cardBackgroundColor,
                                borderWidth: 1,
                                borderColor: cardBorderColor,
                                justifyContent: 'space-between',
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 8,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 11,
                                        fontWeight: '800',
                                        textTransform: 'uppercase',
                                        letterSpacing: 1.2,
                                        color: active ? btnColor : t.textDim,
                                    }}
                                >
                                    {translate(DAY_SHORT_LABEL_KEYS[dayIndex])}
                                </Text>

                                <Ionicons
                                    name={
                                        active
                                            ? 'checkmark-circle'
                                            : 'ellipse-outline'
                                    }
                                    size={16}
                                    color={statusIconColor}
                                />
                            </View>

                            <Text
                                style={{
                                    fontSize: 15,
                                    fontWeight: '900',
                                    marginTop: 12,
                                    color: textColor,
                                }}
                            >
                                {label}
                            </Text>
                        </TouchableOpacity>
                    )
                })}
            </ScrollView>

            <Text
                style={{
                    color: t.textDim,
                    fontSize: 12,
                    marginTop: 14,
                    lineHeight: 18,
                }}
            >
                {value.length === 0
                    ? translate('aiWizard.days.empty')
                    : translate('aiWizard.days.selectedCount', {
                          count: value.length,
                          daySuffix: value.length > 1 ? 's' : '',
                          selectedSuffix: value.length > 1 ? 's' : '',
                      })}
            </Text>
        </View>
    )
}
