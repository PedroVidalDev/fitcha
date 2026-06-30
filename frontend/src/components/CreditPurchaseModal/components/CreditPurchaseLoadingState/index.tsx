import { useTheme } from '@/src/contexts/ThemeContext'
import { ActivityIndicator, View } from 'react-native'

export function CreditPurchaseLoadingState() {
    const { t } = useTheme()

    return (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={t.accent} />
        </View>
    )
}
