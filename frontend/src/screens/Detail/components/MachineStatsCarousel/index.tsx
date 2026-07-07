import { ScrollView, useWindowDimensions } from 'react-native'
import { MachineRecordCard } from '../MachineRecordCard'
import { ProgressChartCard } from '../ProgressChartCard'
import { MachineStatsCarouselProps } from './types'

export function MachineStatsCarousel(props: MachineStatsCarouselProps) {
    const { machine, history } = props
    const { width } = useWindowDimensions()
    const statsCardWidth = Math.min(Math.max(width - 56, 260), 380)

    return (
        <ScrollView
            horizontal
            nestedScrollEnabled
            directionalLockEnabled
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
            contentContainerStyle={{ gap: 12, paddingRight: 4 }}
        >
            <MachineRecordCard
                machine={machine}
                history={history}
                width={statsCardWidth}
            />
            <ProgressChartCard
                machine={machine}
                history={history}
                width={statsCardWidth}
            />
        </ScrollView>
    )
}
