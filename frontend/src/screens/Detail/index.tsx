import { RootStackParamList } from '@/src/router/types'
import { useMachineHistory } from '@/src/screens/Detail/hooks/useMachineHistory'
import { useMachinePhoto } from '@/src/screens/Detail/hooks/useMachinePhoto'
import { Ionicons } from '@expo/vector-icons'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { AnimatedCard } from '../../components/AnimatedCard'
import { AppModal } from '../../components/AppModal'
import { CategoryBadge } from '../../components/CategoryBadge'
import { useI18n } from '../../contexts/I18nContext'
import { useTheme } from '../../contexts/ThemeContext'
import {
    formatSetSequence,
    getHistoryEntryVolume,
    getRecordHistoryEntry,
} from '../../utils/workoutRecords'

type Route = RouteProp<RootStackParamList, 'MachineDetail'>
type PhotoModalAction = {
    label: string
    icon: keyof typeof Ionicons.glyphMap
    variant?: 'default' | 'accent' | 'danger'
    onPress: () => void
}

type PhotoModalState = {
    title: string
    message?: string
    actions: PhotoModalAction[]
    closeLabel?: string
    hideCloseButton?: boolean
}

export default function MachineDetailScreen() {
    const { t } = useTheme()
    const { t: translate } = useI18n()

    const route = useRoute<Route>()
    const navigation = useNavigation()
    const { machineId } = route.params

    const { machine, history } = useMachineHistory(machineId)
    const { photo, updatePhoto, removePhoto } = useMachinePhoto(machineId)

    const [photoModal, setPhotoModal] = useState<PhotoModalState | null>(null)
    const btnColor = t.mode === 'dark' ? '#0d0500' : '#FFF'

    const closePhotoModal = () => {
        setPhotoModal(null)
    }

    const openInfoModal = (title: string, message: string) => {
        setPhotoModal({
            title,
            message,
            hideCloseButton: true,
            actions: [
                {
                    label: translate('common.actions.close'),
                    icon: 'checkmark-circle-outline',
                    variant: 'accent',
                    onPress: closePhotoModal,
                },
            ],
        })
    }

    const pickFromGallery = async () => {
        const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
            openInfoModal(
                translate('detail.permission.title'),
                translate('detail.permission.galleryMessage'),
            )
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        })

        if (!result.canceled && result.assets[0]) {
            await updatePhoto(result.assets[0].uri)
        }
    }

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
            openInfoModal(
                translate('detail.permission.title'),
                translate('detail.permission.cameraMessage'),
            )
            return
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        })

        if (!result.canceled && result.assets[0]) {
            await updatePhoto(result.assets[0].uri)
        }
    }

    const openSourceModal = () => {
        setPhotoModal({
            title: photo
                ? translate('detail.photo.change')
                : translate('detail.photo.add'),
            message: translate('detail.photo.sourceMessage'),
            actions: [
                {
                    label: translate('detail.photo.useCamera'),
                    icon: 'camera-outline',
                    variant: 'accent',
                    onPress: () => {
                        closePhotoModal()
                        void takePhoto()
                    },
                },
                {
                    label: translate('detail.photo.chooseGallery'),
                    icon: 'images-outline',
                    onPress: () => {
                        closePhotoModal()
                        void pickFromGallery()
                    },
                },
            ],
        })
    }

    const openRemovePhotoModal = () => {
        setPhotoModal({
            title: translate('detail.photo.removeTitle'),
            message: translate('detail.photo.removeMessage'),
            actions: [
                {
                    label: translate('detail.photo.removeAction'),
                    icon: 'trash-outline',
                    variant: 'danger',
                    onPress: () => {
                        closePhotoModal()
                        void removePhoto()
                    },
                },
            ],
        })
    }

    const openPhotoActionsModal = () => {
        if (!photo) {
            openSourceModal()
            return
        }

        setPhotoModal({
            title: translate('detail.photo.actionsTitle'),
            message: translate('detail.photo.actionsMessage'),
            actions: [
                {
                    label: translate('detail.photo.change'),
                    icon: 'swap-horizontal-outline',
                    onPress: openSourceModal,
                },
                {
                    label: translate('detail.photo.removeAction'),
                    icon: 'trash-outline',
                    variant: 'danger',
                    onPress: openRemovePhotoModal,
                },
            ],
        })
    }

    const handlePhotoPress = () => {
        openPhotoActionsModal()
    }

    const labelStyle = {
        color: t.textDim,
        fontSize: 11,
        fontWeight: '700' as const,
        textTransform: 'uppercase' as const,
        letterSpacing: 2,
    }

    useEffect(() => {
        if (machine) navigation.setOptions({ title: machine.name })
    }, [machine?.name, navigation])

    if (!machine) return null

    const recordEntry = getRecordHistoryEntry(history)
    const recordVolume = recordEntry ? getHistoryEntryVolume(recordEntry) : null
    const recordOverlayColor =
        t.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.44)'
    const recordStripeColors =
        t.mode === 'dark'
            ? (['rgba(255,208,112,0.16)', 'rgba(244,162,97,0.06)'] as const)
            : (['rgba(244,162,97,0.16)', 'rgba(255,208,112,0.18)'] as const)
    const recordSequenceColor = t.mode === 'dark' ? '#FFF4E6' : t.textPrimary
    const recordDateColor = t.mode === 'dark' ? '#D9A57A' : t.textMuted

    return (
        <>
            <ScrollView
                style={{ flex: 1, backgroundColor: t.bg }}
                contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handlePhotoPress}
                    style={{
                        width: '100%',
                        height: photo ? 180 : 80,
                        borderRadius: 16,
                        marginBottom: 16,
                        backgroundColor: t.inputBg,
                        borderWidth: 0.5,
                        borderColor: t.border,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    {photo ? (
                        <Image
                            source={{ uri: photo }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode='cover'
                        />
                    ) : (
                        <View style={{ alignItems: 'center', gap: 6 }}>
                            <Ionicons
                                name='camera-outline'
                                size={28}
                                color={t.textDim}
                            />
                            <Text
                                style={{
                                    color: t.textDim,
                                    fontSize: 12,
                                    fontWeight: '600',
                                }}
                            >
                                {translate('detail.photo.add')}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 8,
                    }}
                >
                    <CategoryBadge categoryKey={machine.categoryKey} />
                </View>
                {machine.description && (
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 14,
                            lineHeight: 20,
                            marginBottom: 16,
                        }}
                    >
                        {machine.description}
                    </Text>
                )}

                <LinearGradient
                    colors={t.gradientCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 16,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: t.border,
                    }}
                >
                    <View
                        pointerEvents='none'
                        style={{
                            position: 'absolute',
                            top: -28,
                            right: -18,
                            width: 104,
                            height: 104,
                            borderRadius: 999,
                            backgroundColor: recordOverlayColor,
                        }}
                    />
                    <View
                        pointerEvents='none'
                        style={{
                            position: 'absolute',
                            bottom: -30,
                            left: -26,
                            width: 78,
                            height: 78,
                            borderRadius: 999,
                            backgroundColor: recordOverlayColor,
                        }}
                    />
                    <LinearGradient
                        colors={t.gradientAccent}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 4,
                        }}
                    />

                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: 12,
                        }}
                    >
                        <View style={{ flex: 1 }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <View
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 12,
                                        backgroundColor: t.chipBg,
                                        borderWidth: 1,
                                        borderColor: t.border,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Ionicons
                                        name='trophy'
                                        size={18}
                                        color={t.accent}
                                    />
                                </View>
                                <Text
                                    style={{
                                        ...labelStyle,
                                        color: t.textPrimary,
                                    }}
                                >
                                    {translate('detail.record.title')}
                                </Text>
                            </View>
                            <Text
                                style={{
                                    color: t.textMuted,
                                    fontSize: 13,
                                    lineHeight: 18,
                                    marginTop: 8,
                                }}
                            >
                                {recordEntry
                                    ? translate('detail.record.subtitle')
                                    : translate('detail.record.empty')}
                            </Text>
                        </View>

                        {recordVolume !== null && (
                            <View
                                style={{
                                    backgroundColor: t.chipBg,
                                    borderRadius: 999,
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    borderWidth: 1,
                                    borderColor: t.border,
                                }}
                            >
                                <Text
                                    style={{
                                        color: t.accent,
                                        fontSize: 12,
                                        fontWeight: '800',
                                    }}
                                >
                                    {translate('detail.record.volume', {
                                        volume: recordVolume,
                                    })}
                                </Text>
                            </View>
                        )}
                    </View>

                    {recordEntry && (
                        <LinearGradient
                            colors={recordStripeColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                marginTop: 16,
                                borderRadius: 14,
                                paddingHorizontal: 14,
                                paddingVertical: 12,
                                borderWidth: 1,
                                borderColor: t.border,
                            }}
                        >
                            <Text
                                style={{
                                    color: recordSequenceColor,
                                    fontSize: 22,
                                    fontWeight: '900',
                                }}
                            >
                                {formatSetSequence(recordEntry.sets, ' / ')}
                            </Text>
                            <Text
                                style={{
                                    color: recordDateColor,
                                    fontSize: 12,
                                    marginTop: 6,
                                }}
                            >
                                {recordEntry.label}
                            </Text>
                        </LinearGradient>
                    )}
                </LinearGradient>

                <Text
                    style={{ ...labelStyle, marginBottom: 12, marginLeft: 2 }}
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
                            <AnimatedCard key={item.id} index={index}>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        backgroundColor: t.histBg,
                                        borderRadius: 12,
                                        paddingHorizontal: 16,
                                        paddingVertical: 12,
                                        borderWidth: 0.5,
                                        borderColor: t.border,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: t.textMuted,
                                            fontSize: 13,
                                            fontWeight: '500',
                                        }}
                                    >
                                        {item.label}
                                    </Text>
                                    <Text
                                        style={{
                                            color: t.accent,
                                            fontSize: 14,
                                            fontWeight: '700',
                                        }}
                                    >
                                        {formatSetSequence(item.sets, ' / ')}
                                    </Text>
                                </View>
                            </AnimatedCard>
                        ))}
                    </View>
                )}
            </ScrollView>

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
                                            color={btnColor}
                                        />
                                        <Text
                                            style={{
                                                color: btnColor,
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
        </>
    )
}
