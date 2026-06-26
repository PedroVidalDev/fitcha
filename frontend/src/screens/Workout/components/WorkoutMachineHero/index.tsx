import { CategoryBadge } from '@/src/components/CategoryBadge'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { Image, Text, View } from 'react-native'
import { type WorkoutMachineHeroProps } from './types'

export function WorkoutMachineHero(props: WorkoutMachineHeroProps) {
    const { machine } = props
    const { t } = useTheme()

    return (
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
            {machine.photo ? (
                <Image
                    source={{ uri: machine.photo }}
                    style={{
                        width: '100%',
                        height: 140,
                        borderRadius: 16,
                        marginBottom: 14,
                    }}
                    resizeMode='cover'
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
            <CategoryBadge categoryKey={machine.categoryKey} />
        </View>
    )
}
