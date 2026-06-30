import { ActivityIndicator, View } from 'react-native'
import { useTheme } from '@/src/contexts/ThemeContext'

export function WorkoutLoadingState() {
    const { t } = useTheme()

    return (
        <View
            style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: t.bg,
            }}
        >
            <ActivityIndicator size='large' color={t.accent} />
        </View>
    )
}
