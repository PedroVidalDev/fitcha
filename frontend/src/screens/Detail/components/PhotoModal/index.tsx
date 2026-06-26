import { AppModal } from '@/src/components/AppModal'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { PhotoModalProps } from './types'
import { Ionicons } from '@expo/vector-icons'

export const PhotoModal = (props: PhotoModalProps) => {
    const { photoModal, closePhotoModal } = props

    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <AppModal visible={!!photoModal} onClose={closePhotoModal} compact>
            <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={{ paddingBottom: 4 }}
            >
                <Text
                    style={{
                        color: t.accent,
                        fontSize: 20,
                        fontWeight: '800',
                        marginBottom: 10,
                    }}
                >
                    {photoModal?.title ?? ''}
                </Text>
                {!!photoModal?.message && (
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 14,
                            lineHeight: 20,
                            marginBottom: 18,
                        }}
                    >
                        {photoModal.message}
                    </Text>
                )}

                <View style={{ gap: 10 }}>
                    {photoModal?.actions.map((action) => (
                        <TouchableOpacity
                            key={action.label}
                            activeOpacity={0.78}
                            onPress={action.onPress}
                        >
                            {action.variant === 'accent' ? (
                                <LinearGradient
                                    colors={t.gradientAccent}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 10,
                                        paddingVertical: 14,
                                        paddingHorizontal: 16,
                                        borderRadius: 14,
                                    }}
                                >
                                    <Ionicons
                                        name={action.icon}
                                        size={18}
                                        color={t.btnColor}
                                    />
                                    <Text
                                        style={{
                                            color: t.btnColor,
                                            fontSize: 15,
                                            fontWeight: '800',
                                        }}
                                    >
                                        {action.label}
                                    </Text>
                                </LinearGradient>
                            ) : (
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 10,
                                        paddingVertical: 14,
                                        paddingHorizontal: 16,
                                        borderRadius: 14,
                                        backgroundColor:
                                            action.variant === 'danger'
                                                ? '#EF5350'
                                                : t.inputBg,
                                        borderWidth:
                                            action.variant === 'danger'
                                                ? 0
                                                : 0.5,
                                        borderColor:
                                            action.variant === 'danger'
                                                ? 'transparent'
                                                : t.border,
                                    }}
                                >
                                    <Ionicons
                                        name={action.icon}
                                        size={18}
                                        color={
                                            action.variant === 'danger'
                                                ? '#FFF'
                                                : t.textMuted
                                        }
                                    />
                                    <Text
                                        style={{
                                            color:
                                                action.variant === 'danger'
                                                    ? '#FFF'
                                                    : t.textMuted,
                                            fontSize: 15,
                                            fontWeight: '700',
                                        }}
                                    >
                                        {action.label}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {!photoModal?.hideCloseButton && (
                    <TouchableOpacity
                        onPress={closePhotoModal}
                        activeOpacity={0.8}
                        style={{
                            marginTop: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 14,
                            borderWidth: 0.5,
                            borderColor: t.border,
                            backgroundColor: t.card,
                            paddingVertical: 14,
                            paddingHorizontal: 16,
                        }}
                    >
                        <Text
                            style={{
                                color: t.textMuted,
                                fontSize: 15,
                                fontWeight: '700',
                            }}
                        >
                            {photoModal?.closeLabel ??
                                translate('common.actions.cancel')}
                        </Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </AppModal>
    )
}
