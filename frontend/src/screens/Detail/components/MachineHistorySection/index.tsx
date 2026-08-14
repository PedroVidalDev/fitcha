import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { PaginationControls } from '@/src/components/PaginationControls'
import { ActivityIndicator, Text, View } from 'react-native'
import { History } from '../History'
import { MachineHistorySectionProps } from './types'

export function MachineHistorySection(props: MachineHistorySectionProps) {
    const {
        machine,
        history,
        page,
        totalPages,
        isLoading,
        errorMessage,
        onChangePage,
        deletingHistoryId,
        onRequestDelete,
    } = props
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

            {history.length > 0 ? (
                <Text
                    style={{
                        color: t.textDim,
                        fontSize: 12,
                        lineHeight: 18,
                        marginBottom: 12,
                        marginLeft: 2,
                    }}
                >
                    {translate('detail.history.holdHint')}
                </Text>
            ) : null}

            {isLoading && history.length === 0 ? (
                <ActivityIndicator
                    size='small'
                    color={t.accent}
                    style={{ marginTop: 24 }}
                />
            ) : errorMessage && history.length === 0 ? (
                <Text
                    style={{
                        color: '#EF5350',
                        textAlign: 'center',
                        marginTop: 24,
                        fontSize: 13,
                    }}
                >
                    {errorMessage}
                </Text>
            ) : history.length === 0 ? (
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
                            isBusy={deletingHistoryId === item.id}
                            onRequestDelete={onRequestDelete}
                        />
                    ))}
                    <PaginationControls
                        page={page}
                        totalPages={totalPages}
                        disabled={isLoading}
                        onChangePage={onChangePage}
                    />
                </View>
            )}
        </>
    )
}
