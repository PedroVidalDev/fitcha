import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { ProfileCard } from '../ProfileCard'
import { type ProfileCreditsSectionProps } from './types'

export function ProfileCreditsSection(props: ProfileCreditsSectionProps) {
    const {
        credits,
        payment,
        paymentExpiresAt,
        hasPendingPayment,
        isLoading,
        onOpenModal,
    } = props
    const { t: theme } = useTheme()
    const { t } = useI18n()
    const btnColor = theme.mode === 'dark' ? '#0d0500' : '#FFF'

    return (
        <ProfileCard>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                }}
            >
                <View
                    style={{
                        flex: 1,
                        minWidth: 0,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
                    <View
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            backgroundColor: theme.chipBg,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Ionicons
                            name='sparkles'
                            size={20}
                            color={theme.accent}
                        />
                    </View>
                    <View style={{ flexShrink: 1 }}>
                        <Text
                            style={{
                                color: theme.textPrimary,
                                fontSize: 18,
                                fontWeight: '800',
                            }}
                        >
                            Fitcha AI
                        </Text>
                        <Text
                            style={{
                                color: theme.textMuted,
                                fontSize: 13,
                            }}
                        >
                            {t('profile.credits.subtitle')}
                        </Text>
                    </View>
                </View>

                <View
                    style={{
                        backgroundColor: theme.accent,
                        borderRadius: 999,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        marginLeft: 12,
                        flexShrink: 0,
                    }}
                >
                    <Text
                        style={{
                            color: btnColor,
                            fontSize: 11,
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                        }}
                    >
                        {t('profile.credits.balanceLabel')}
                    </Text>
                </View>
            </View>

            <Text
                style={{
                    color: theme.textMuted,
                    fontSize: 14,
                    lineHeight: 21,
                    marginBottom: 14,
                }}
            >
                {t('profile.credits.description')}
            </Text>

            <View
                style={{
                    backgroundColor: theme.chipBg,
                    borderRadius: 20,
                    padding: 18,
                    marginBottom: 18,
                }}
            >
                <Text
                    style={{
                        color: theme.textDim,
                        fontSize: 12,
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: 1.2,
                        marginBottom: 8,
                    }}
                >
                    {t('profile.credits.balanceLabel')}
                </Text>
                <Text
                    style={{
                        color: theme.textPrimary,
                        fontSize: 42,
                        fontWeight: '900',
                    }}
                >
                    {credits}
                </Text>
                <Text
                    style={{
                        color: theme.textMuted,
                        fontSize: 13,
                        lineHeight: 20,
                        marginTop: 6,
                    }}
                >
                    {t('profile.credits.balanceHint')}
                </Text>
            </View>

            {isLoading ? (
                <View
                    style={{
                        paddingVertical: 18,
                        alignItems: 'center',
                    }}
                >
                    <ActivityIndicator color={theme.accent} />
                </View>
            ) : hasPendingPayment ? (
                <View style={{ gap: 12 }}>
                    <View
                        style={{
                            backgroundColor: theme.chipBg,
                            borderRadius: 16,
                            padding: 16,
                        }}
                    >
                        <Text
                            style={{
                                color: theme.textPrimary,
                                fontSize: 16,
                                fontWeight: '900',
                                marginBottom: 6,
                            }}
                        >
                            {t('profile.credits.pendingTitle')}
                        </Text>
                        <Text
                            style={{
                                color: theme.textMuted,
                                fontSize: 14,
                                lineHeight: 21,
                            }}
                        >
                            {paymentExpiresAt
                                ? t(
                                      'profile.credits.pendingDescriptionWithDate',
                                      {
                                          date: paymentExpiresAt,
                                          quantity:
                                              payment?.creditQuantity ?? 1,
                                      },
                                  )
                                : t('profile.credits.pendingDescription')}
                        </Text>
                    </View>

                    <TouchableOpacity activeOpacity={0.8} onPress={onOpenModal}>
                        <LinearGradient
                            colors={theme.gradientAccent}
                            style={{
                                borderRadius: 16,
                                paddingVertical: 15,
                                paddingHorizontal: 18,
                            }}
                        >
                            <Text
                                style={{
                                    color: btnColor,
                                    fontSize: 16,
                                    fontWeight: '900',
                                    textAlign: 'center',
                                }}
                            >
                                {t('profile.credits.continuePayment')}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity activeOpacity={0.8} onPress={onOpenModal}>
                    <LinearGradient
                        colors={theme.gradientAccent}
                        style={{
                            borderRadius: 16,
                            paddingVertical: 15,
                            paddingHorizontal: 18,
                        }}
                    >
                        <Text
                            style={{
                                color: btnColor,
                                fontSize: 16,
                                fontWeight: '900',
                                textAlign: 'center',
                            }}
                        >
                            {t('profile.credits.buy')}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </ProfileCard>
    )
}
