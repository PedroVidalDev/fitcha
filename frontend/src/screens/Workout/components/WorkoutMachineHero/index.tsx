import { CategoryBadge } from '@/src/components/CategoryBadge'
import { MachineImage } from '@/src/components/MachineImage'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { buildYouTubeTutorialUrl } from '@/src/screens/Workout/helpers'
import { Ionicons } from '@expo/vector-icons'
import { Alert, Linking, Text, TouchableOpacity, View } from 'react-native'
import { type WorkoutMachineHeroProps } from './types'

export function WorkoutMachineHero(props: WorkoutMachineHeroProps) {
    const { machine } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    const handleOpenTutorial = async () => {
        try {
            await Linking.openURL(buildYouTubeTutorialUrl(machine.name))
        } catch {
            Alert.alert(
                translate('workout.tutorial.errorTitle'),
                translate('workout.tutorial.errorMessage'),
            )
        }
    }

    return (
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
            {machine.photo ? (
                <MachineImage
                    uri={machine.photo}
                    priority='high'
                    style={{
                        width: '100%',
                        height: 140,
                        borderRadius: 16,
                        marginBottom: 14,
                    }}
                />
            ) : (
                <View
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: 20,
                        backgroundColor: t.chipBg,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 14,
                    }}
                >
                    <Ionicons
                        name='barbell-outline'
                        size={36}
                        color={t.accent}
                    />
                </View>
            )}

            <Text
                style={{
                    color: t.textPrimary,
                    fontSize: 22,
                    fontWeight: '900',
                    textAlign: 'center',
                }}
            >
                {machine.name}
            </Text>
            <CategoryBadge
                categoryKey={machine.categoryKey}
                containerStyle={{ alignSelf: 'center', marginTop: 8 }}
            />

            <TouchableOpacity
                activeOpacity={0.78}
                accessibilityRole='link'
                accessibilityLabel={translate(
                    'workout.tutorial.accessibilityLabel',
                    { name: machine.name },
                )}
                onPress={() => void handleOpenTutorial()}
                style={{
                    marginTop: 14,
                    paddingHorizontal: 15,
                    paddingVertical: 10,
                    borderRadius: 999,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: '#FF00331A',
                    borderWidth: 0.5,
                    borderColor: '#FF003355',
                }}
            >
                <Ionicons name='logo-youtube' size={20} color='#FF0033' />
                <Text
                    style={{
                        color: t.textPrimary,
                        fontSize: 13,
                        fontWeight: '800',
                    }}
                >
                    {translate('workout.tutorial.cta')}
                </Text>
            </TouchableOpacity>
        </View>
    )
}
