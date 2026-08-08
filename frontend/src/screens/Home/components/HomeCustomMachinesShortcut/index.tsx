import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, TouchableOpacity, View } from 'react-native'

type HomeCustomMachinesShortcutProps = {
    count: number
    onPress: () => void
}

export function HomeCustomMachinesShortcut(
    props: HomeCustomMachinesShortcutProps,
) {
    const { count, onPress } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <TouchableOpacity activeOpacity={0.82} onPress={onPress}>
            <LinearGradient
                colors={t.gradientHero}
                style={{
                    borderRadius: 18,
                    padding: 15,
                    borderWidth: 1,
                    borderColor: t.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    overflow: 'hidden',
                }}
            >
                <View
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: t.chipBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Ionicons name='barbell' size={21} color={t.accent} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            color: t.textPrimary,
                            fontSize: 15,
                            fontWeight: '900',
                        }}
                    >
                        {translate('customMachines.homeTitle')}
                    </Text>
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 12,
                            lineHeight: 17,
                            marginTop: 3,
                        }}
                    >
                        {translate('customMachines.homeSubtitle', { count })}
                    </Text>
                </View>
                <Ionicons name='chevron-forward' size={19} color={t.textDim} />
            </LinearGradient>
        </TouchableOpacity>
    )
}
