import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, TouchableOpacity, View } from 'react-native'
import { type DayActionButtonsProps } from './types'

export function DayActionButtons(props: DayActionButtonsProps) {
    const { onAddMachine, onEditWorkout, onDeleteWorkout } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onAddMachine}
                style={{ flex: 1 }}
            >
                <LinearGradient
                    colors={t.gradientAccent}
                    style={{
                        borderRadius: 16,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                    }}
                >
                    <Ionicons name='add-circle' size={22} color={t.btnColor} />
                    <Text
                        style={{
                            color: t.btnColor,
                            fontSize: 16,
                            fontWeight: '900',
                        }}
                    >
                        {translate('day.addButton')}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onEditWorkout}
                style={{
                    width: 56,
                    borderRadius: 16,
                    backgroundColor: t.inputBg,
                    borderWidth: 0.5,
                    borderColor: t.border,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Ionicons
                    name='create-outline'
                    size={22}
                    color={t.textPrimary}
                />
            </TouchableOpacity>

            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onDeleteWorkout}
                style={{
                    width: 56,
                    borderRadius: 16,
                    backgroundColor: t.inputBg,
                    borderWidth: 0.5,
                    borderColor: t.border,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Ionicons name='trash-outline' size={22} color='#EF5350' />
            </TouchableOpacity>
        </View>
    )
}
