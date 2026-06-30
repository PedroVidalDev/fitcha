import { Input } from '@/src/components/Input'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, TouchableOpacity, View } from 'react-native'
import { type CreditPurchaseDocumentStepProps } from './types'

export function CreditPurchaseDocumentStep(
    props: CreditPurchaseDocumentStepProps,
) {
    const {
        quantity,
        amountLabel,
        documentNumber,
        isCreatingCheckout,
        onDocumentNumberChange,
        onBack,
        onGenerateCheckout,
    } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <>
            <Text
                style={{
                    color: t.textPrimary,
                    fontSize: 18,
                    fontWeight: '900',
                    marginBottom: 8,
                }}
            >
                {translate('creditCheckout.documentTitle')}
            </Text>
            <Text
                style={{
                    color: t.textMuted,
                    fontSize: 13,
                    lineHeight: 20,
                    marginBottom: 18,
                }}
            >
                {translate('creditCheckout.documentDescription')}
            </Text>

            <View
                style={{
                    backgroundColor: t.inputBg,
                    borderRadius: 16,
                    borderWidth: 0.5,
                    borderColor: t.border,
                    padding: 16,
                    marginBottom: 18,
                }}
            >
                <Text
                    style={{
                        color: t.textPrimary,
                        fontSize: 15,
                        fontWeight: '800',
                        marginBottom: 4,
                    }}
                >
                    {translate('creditCheckout.summaryCredits', {
                        count: quantity,
                    })}
                </Text>
                <Text style={{ color: t.textMuted, fontSize: 13 }}>
                    {amountLabel}
                </Text>
            </View>

            <Input
                label={translate('creditCheckout.documentLabel')}
                icon='card-outline'
                value={documentNumber}
                onChangeText={onDocumentNumberChange}
                placeholder={translate('creditCheckout.documentPlaceholder')}
                keyboardType='numeric'
                error={undefined}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={onBack}
                    style={{
                        flex: 1,
                        borderRadius: 16,
                        borderWidth: 0.5,
                        borderColor: t.border,
                        paddingVertical: 15,
                        alignItems: 'center',
                        backgroundColor: t.card,
                    }}
                >
                    <Text
                        style={{
                            color: t.textPrimary,
                            fontSize: 15,
                            fontWeight: '800',
                        }}
                    >
                        {translate('common.actions.back')}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isCreatingCheckout}
                    onPress={onGenerateCheckout}
                    style={{
                        flex: 1,
                        opacity: isCreatingCheckout ? 0.8 : 1,
                    }}
                >
                    <LinearGradient
                        colors={t.gradientAccent}
                        style={{
                            borderRadius: 16,
                            paddingVertical: 15,
                            alignItems: 'center',
                        }}
                    >
                        <Text
                            style={{
                                color: t.btnColor,
                                fontSize: 15,
                                fontWeight: '900',
                            }}
                        >
                            {isCreatingCheckout
                                ? translate('creditCheckout.generatingPix')
                                : translate('creditCheckout.generatePix')}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </>
    )
}
