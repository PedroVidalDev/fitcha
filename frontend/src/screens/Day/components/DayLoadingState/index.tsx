import { useTheme } from '@/src/contexts/ThemeContext'
import { ActivityIndicator, View } from 'react-native'
import { type DayLoadingStateProps } from './types'

export function DayLoadingState(props: DayLoadingStateProps) {
    void props

    const { t } = useTheme()

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: t.bg,
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <ActivityIndicator size='large' color={t.accent} />
        </View>
    )
}
