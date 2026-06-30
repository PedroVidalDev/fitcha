import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { Text, TouchableOpacity, View } from 'react-native'
import { StepIntensityProps } from './types'

export const StepIntensity = (props: StepIntensityProps) => {
    const { value, onChange } = props

    const { t } = useTheme()
    const { t: translate } = useI18n()
    const options: {
        key: 'leve' | 'moderado' | 'intenso'
        icon: string
        titleKey:
            | 'aiWizard.intensity.light.title'
            | 'aiWizard.intensity.moderate.title'
            | 'aiWizard.intensity.intense.title'
        descKey:
            | 'aiWizard.intensity.light.description'
            | 'aiWizard.intensity.moderate.description'
            | 'aiWizard.intensity.intense.description'
    }[] = [
        {
            key: 'leve',
            icon: 'leaf-outline',
            titleKey: 'aiWizard.intensity.light.title',
            descKey: 'aiWizard.intensity.light.description',
        },
        {
            key: 'moderado',
            icon: 'flame-outline',
            titleKey: 'aiWizard.intensity.moderate.title',
            descKey: 'aiWizard.intensity.moderate.description',
        },
        {
            key: 'intenso',
            icon: 'flash-outline',
            titleKey: 'aiWizard.intensity.intense.title',
            descKey: 'aiWizard.intensity.intense.description',
        },
    ]

    return (
        <View style={{ gap: 10 }}>
            {options.map((opt) => {
                const active = value === opt.key
                return (
                    <TouchableOpacity
                        key={opt.key}
                        onPress={() => onChange(opt.key)}
                        activeOpacity={0.7}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 14,
                            padding: 16,
                            borderRadius: 14,
                            backgroundColor: active ? t.accent : t.inputBg,
                            borderWidth: 0.5,
                            borderColor: active ? t.accent : t.border,
                        }}
                    >
                        <Ionicons
                            name={opt.icon as any}
                            size={22}
                            color={
                                active
                                    ? t.mode === 'dark'
                                        ? '#0d0500'
                                        : '#FFF'
                                    : t.textMuted
                            }
                        />
                        <View>
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontWeight: '800',
                                    textTransform: 'capitalize',
                                    color: active
                                        ? t.mode === 'dark'
                                            ? '#0d0500'
                                            : '#FFF'
                                        : t.textPrimary,
                                }}
                            >
                                {translate(opt.titleKey)}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 12,
                                    marginTop: 2,
                                    color: active
                                        ? t.mode === 'dark'
                                            ? 'rgba(13,5,0,0.6)'
                                            : 'rgba(255,255,255,0.7)'
                                        : t.textMuted,
                                }}
                            >
                                {translate(opt.descKey)}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )
            })}
        </View>
    )
}
