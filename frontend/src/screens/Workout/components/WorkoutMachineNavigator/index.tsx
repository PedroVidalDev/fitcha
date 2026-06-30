import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { type WorkoutMachineNavigatorProps } from './types'

export function WorkoutMachineNavigator(props: WorkoutMachineNavigatorProps) {
    const {
        machineNavScrollRef,
        items,
        canGoPrev,
        canGoNext,
        onPressPrevious,
        onPressNext,
        onSelectMachine,
    } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <View
            style={{
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: 8,
                gap: 10,
            }}
        >
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                }}
            >
                <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={onPressPrevious}
                    disabled={!canGoPrev}
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: t.inputBg,
                        borderWidth: 0.5,
                        borderColor: t.border,
                        opacity: canGoPrev ? 1 : 0.4,
                    }}
                >
                    <Ionicons
                        name='chevron-back'
                        size={20}
                        color={t.textPrimary}
                    />
                </TouchableOpacity>

                <ScrollView
                    ref={machineNavScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingRight: 4 }}
                    style={{ flex: 1 }}
                >
                    {items.map((item, index) => {
                        const chipBackgroundColor = item.isCurrent
                            ? t.accent
                            : item.isComplete
                              ? t.accent + '18'
                              : item.hasDraft
                                ? t.chipBg
                                : t.inputBg
                        const chipBorderColor = item.isCurrent
                            ? t.accent
                            : item.isComplete
                              ? t.accent + '70'
                              : item.hasDraft
                                ? t.accentDark + '70'
                                : t.border
                        const chipTextColor = item.isCurrent
                            ? t.btnColor
                            : t.textPrimary
                        const statusIconName = item.isComplete
                            ? 'checkmark-circle'
                            : item.hasDraft
                              ? 'ellipse'
                              : 'ellipse-outline'
                        const statusIconColor = item.isCurrent
                            ? t.btnColor
                            : item.isComplete
                              ? t.accent
                              : item.hasDraft
                                ? t.accentDark
                                : t.textDim

                        return (
                            <TouchableOpacity
                                key={item.id}
                                activeOpacity={0.8}
                                onPress={() => onSelectMachine(index)}
                                style={{ minWidth: 60 }}
                            >
                                <View
                                    style={{
                                        minHeight: 44,
                                        borderRadius: 16,
                                        paddingHorizontal: 12,
                                        paddingVertical: 10,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: chipBackgroundColor,
                                        borderWidth: 1,
                                        borderColor: chipBorderColor,
                                    }}
                                >
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: chipTextColor,
                                                fontSize: 14,
                                                fontWeight: '900',
                                            }}
                                        >
                                            {item.position}
                                        </Text>
                                        <Ionicons
                                            name={statusIconName}
                                            size={14}
                                            color={statusIconColor}
                                        />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>

                <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={onPressNext}
                    disabled={!canGoNext}
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: t.inputBg,
                        borderWidth: 0.5,
                        borderColor: t.border,
                        opacity: canGoNext ? 1 : 0.4,
                    }}
                >
                    <Ionicons
                        name='chevron-forward'
                        size={20}
                        color={t.textPrimary}
                    />
                </TouchableOpacity>
            </View>

            <Text
                style={{
                    color: t.textDim,
                    fontSize: 12,
                    lineHeight: 18,
                }}
            >
                {translate('workout.swapHint')}
            </Text>
        </View>
    )
}
