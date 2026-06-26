import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, View } from 'react-native'
import { WorkoutSeriesCard } from '../WorkoutSeriesCard'
import { type WorkoutSeriesListProps } from './types'

export function WorkoutSeriesList(props: WorkoutSeriesListProps) {
    const { machineId, items, hasLockedSeries, onChangeField, onConfirmField } =
        props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <>
            <Text
                style={{
                    color: t.textDim,
                    fontSize: 11,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    marginBottom: 12,
                    marginLeft: 4,
                }}
            >
                {translate('workout.fillSeries')}
            </Text>

            <View style={{ gap: 10 }}>
                {items.map((item) => (
                    <WorkoutSeriesCard
                        key={`${machineId}-${item.key}`}
                        item={item}
                        onChangeField={onChangeField}
                        onConfirmField={onConfirmField}
                    />
                ))}
            </View>

            {hasLockedSeries ? (
                <Text
                    style={{
                        color: t.textDim,
                        fontSize: 12,
                        lineHeight: 18,
                        marginTop: 10,
                        marginLeft: 4,
                    }}
                >
                    {translate('workout.series.lockedHint')}
                </Text>
            ) : null}
        </>
    )
}
