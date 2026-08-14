import { AppModal } from '@/src/components/AppModal'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { TransferHistoryScopeModalProps } from './types'

export function TransferHistoryScopeModal(
    props: TransferHistoryScopeModalProps,
) {
    const { sourceName, target, isBusy, errorMessage, onCancel, onTransfer } =
        props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <AppModal
            visible={!!target}
            onClose={isBusy ? () => undefined : onCancel}
            compact
        >
            <Text
                style={{
                    color: t.accent,
                    fontSize: 20,
                    fontWeight: '900',
                    marginBottom: 10,
                }}
            >
                {translate('detail.transfer.scopeTitle')}
            </Text>
            <Text
                style={{
                    color: t.textMuted,
                    fontSize: 14,
                    lineHeight: 20,
                    marginBottom: 18,
                }}
            >
                {translate('detail.transfer.scopeMessage', {
                    source: sourceName,
                    target: target?.name ?? '',
                })}
            </Text>

            {errorMessage ? (
                <Text
                    style={{
                        color: '#EF5350',
                        fontSize: 13,
                        lineHeight: 19,
                        marginBottom: 14,
                    }}
                >
                    {errorMessage}
                </Text>
            ) : null}

            <View style={{ gap: 10 }}>
                <TouchableOpacity
                    disabled={isBusy}
                    activeOpacity={0.78}
                    onPress={() => onTransfer(true)}
                >
                    <LinearGradient
                        colors={t.gradientAccent}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 9,
                            borderRadius: 14,
                            paddingVertical: 14,
                            opacity: isBusy ? 0.7 : 1,
                        }}
                    >
                        {isBusy ? (
                            <ActivityIndicator
                                size='small'
                                color={t.btnColor}
                            />
                        ) : (
                            <Ionicons
                                name='swap-horizontal-outline'
                                size={19}
                                color={t.btnColor}
                            />
                        )}
                        <Text
                            style={{
                                color: t.btnColor,
                                fontSize: 15,
                                fontWeight: '900',
                            }}
                        >
                            {translate('detail.transfer.historyAndWorkouts')}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    disabled={isBusy}
                    activeOpacity={0.78}
                    onPress={() => onTransfer(false)}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 9,
                        borderRadius: 14,
                        paddingVertical: 14,
                        backgroundColor: t.inputBg,
                        borderWidth: 0.5,
                        borderColor: t.border,
                        opacity: isBusy ? 0.55 : 1,
                    }}
                >
                    <Ionicons
                        name='analytics-outline'
                        size={19}
                        color={t.textMuted}
                    />
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 15,
                            fontWeight: '800',
                        }}
                    >
                        {translate('detail.transfer.historyOnly')}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    disabled={isBusy}
                    onPress={onCancel}
                    style={{ alignItems: 'center', paddingVertical: 11 }}
                >
                    <Text
                        style={{
                            color: t.textDim,
                            fontSize: 14,
                            fontWeight: '700',
                        }}
                    >
                        {translate('common.actions.cancel')}
                    </Text>
                </TouchableOpacity>
            </View>
        </AppModal>
    )
}
