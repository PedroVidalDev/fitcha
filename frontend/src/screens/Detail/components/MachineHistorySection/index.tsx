import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, View } from 'react-native'
import { History } from '../History'
import { MachineHistorySectionProps } from './types'

export function MachineHistorySection(props: MachineHistorySectionProps) {
    const { machine, history } = props
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
                    marginLeft: 2,
                }}
            >
                {translate('detail.history.title')}
            </Text>

            {history.length === 0 ? (
                <Text
                    style={{
                        color: t.textDim,
                        textAlign: 'center',
                        marginTop: 24,
                        fontSize: 14,
                    }}
                >
                    {translate('detail.history.empty')}
                </Text>
            ) : (
                <View style={{ gap: 8 }}>
                    {history.map((item, index) => (
                        <History
                            key={item.id}
                            item={item}
                            index={index}
                            machine={machine}
                        />
                    ))}
                </View>
            )}
        </>
    )
}
