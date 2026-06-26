import { useTheme } from '@/src/contexts/ThemeContext'
import { View } from 'react-native'
import { MachineProgressHeader } from './components/MachineProgressHeader'
import { MachineProgressHistory } from './components/MachineProgressHistory'
import { MachineProgressMetrics } from './components/MachineProgressMetrics'
import { type MachineProgressCardProps } from './types'

export function MachineProgressCard(props: MachineProgressCardProps) {
    const { item, width } = props
    const { t } = useTheme()

    return (
        <View
            style={{
                width,
                backgroundColor: t.inputBg,
                borderRadius: 20,
                padding: 16,
                borderWidth: 0.5,
                borderColor: t.border,
            }}
        >
            <MachineProgressHeader item={item} />
            <MachineProgressMetrics item={item} />
            <MachineProgressHistory item={item} />
        </View>
    )
}
