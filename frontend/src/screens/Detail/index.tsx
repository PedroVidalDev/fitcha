import { ConfirmModal } from '@/src/components/ConfirmModal'
import { ProfileShortcutButton } from '@/src/components/ProfileShortcutButton'
import { HistoryEntry } from '@/src/dtos/HistoryEntry'
import { RootStackParamList } from '@/src/router/types'
import { useMachineDetail } from '@/src/screens/Detail/hooks/useMachineDetail'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useCallback, useLayoutEffect, useState } from 'react'
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native'
import { useI18n } from '../../contexts/I18nContext'
import { useTheme } from '../../contexts/ThemeContext'
import { MachineHistorySection } from './components/MachineHistorySection'
import { HistoryTransferModal } from './components/HistoryTransferModal'
import { HistoryTransferTarget } from './components/HistoryTransferModal/types'
import { MachineIntro } from './components/MachineIntro'
import { MachinePhotoCard } from './components/MachinePhotoCard'
import { MachineStatsCarousel } from './components/MachineStatsCarousel'
import { PhotoModal } from './components/PhotoModal'
import { PhotoModalState } from './components/PhotoModal/types'
import { TransferHistoryScopeModal } from './components/TransferHistoryScopeModal'

type Route = RouteProp<RootStackParamList, 'MachineDetail'>
type Navigation = NativeStackNavigationProp<RootStackParamList, 'MachineDetail'>

export default function MachineDetailScreen() {
    const { t } = useTheme()
    const { t: translate } = useI18n()

    const route = useRoute<Route>()
    const navigation = useNavigation<Navigation>()
    const { machineId } = route.params

    const {
        machine,
        history,
        statsHistory,
        historyPage,
        historyTotalPages,
        isHistoryLoading,
        historyError,
        changeHistoryPage,
        updatePhoto,
        removePhoto,
        deleteHistoryEntry,
        transferHistory,
    } = useMachineDetail(machineId)
    const photo = machine?.photo

    const [photoModal, setPhotoModal] = useState<PhotoModalState | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<HistoryEntry | null>(null)
    const [deletingHistoryId, setDeletingHistoryId] = useState<string>()
    const [isTransferModalVisible, setIsTransferModalVisible] = useState(false)
    const [transferTarget, setTransferTarget] =
        useState<HistoryTransferTarget | null>(null)
    const [isTransferring, setIsTransferring] = useState(false)
    const [transferError, setTransferError] = useState('')

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

    const handleOpenTransfer = useCallback(() => {
        if (history.length === 0 || isTransferring) return
        setTransferError('')
        setIsTransferModalVisible(true)
    }, [history.length, isTransferring])

    useLayoutEffect(() => {
        navigation.setOptions({
            ...(machine?.name ? { title: machine.name } : {}),
            headerRight: () => (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                    }}
                >
                    <TouchableOpacity
                        disabled={history.length === 0 || isTransferring}
                        accessibilityRole='button'
                        accessibilityLabel={translate(
                            'detail.transfer.headerAccessibilityLabel',
                        )}
                        onPress={handleOpenTransfer}
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 999,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: t.inputBg,
                            borderWidth: 0.5,
                            borderColor: t.border,
                            opacity:
                                history.length === 0 || isTransferring
                                    ? 0.4
                                    : 1,
                        }}
                    >
                        <Ionicons
                            name='swap-horizontal-outline'
                            size={19}
                            color={t.accent}
                        />
                    </TouchableOpacity>
                    <ProfileShortcutButton />
                </View>
            ),
        })
    }, [
        handleOpenTransfer,
        history.length,
        isTransferring,
        machine?.name,
        navigation,
        t.accent,
        t.border,
        t.inputBg,
        translate,
    ])

    const handleConfirmDelete = async () => {
        if (!deleteTarget || deletingHistoryId) return

        try {
            setDeletingHistoryId(deleteTarget.id)
            await deleteHistoryEntry(deleteTarget.id)
            setDeleteTarget(null)
        } catch (error) {
            Alert.alert(
                translate('detail.history.deleteErrorTitle'),
                error instanceof Error
                    ? error.message
                    : translate('services.history.deleteError'),
            )
        } finally {
            setDeletingHistoryId(undefined)
        }
    }

    const handleSelectTransferTarget = (target: HistoryTransferTarget) => {
        setIsTransferModalVisible(false)
        setTransferError('')
        setTransferTarget(target)
    }

    const handleTransfer = async (replaceInWorkouts: boolean) => {
        if (!transferTarget || isTransferring) return

        try {
            setIsTransferring(true)
            setTransferError('')
            const response = await transferHistory(
                transferTarget.kind === 'userMachine'
                    ? {
                          targetUserMachineId: transferTarget.id,
                          replaceInWorkouts,
                      }
                    : {
                          targetCatalogMachineId: transferTarget.id,
                          replaceInWorkouts,
                      },
            )

            setTransferTarget(null)
            navigation.replace('MachineDetail', {
                machineId: response.targetMachine.id,
            })
        } catch (error) {
            setTransferError(
                error instanceof Error
                    ? error.message
                    : translate('services.history.transferError'),
            )
        } finally {
            setIsTransferring(false)
        }
    }

    if (!machine) return null

    return (
        <>
            <ScrollView
                style={{ flex: 1, backgroundColor: t.bg }}
                contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
            >
                <MachinePhotoCard photo={photo} onPress={handlePhotoPress} />
                <MachineIntro machine={machine} />
                <MachineStatsCarousel
                    machine={machine}
                    history={statsHistory}
                />
                <MachineHistorySection
                    machine={machine}
                    history={history}
                    page={historyPage}
                    totalPages={historyTotalPages}
                    isLoading={isHistoryLoading}
                    errorMessage={historyError}
                    onChangePage={(page) => void changeHistoryPage(page)}
                    deletingHistoryId={deletingHistoryId}
                    onRequestDelete={setDeleteTarget}
                />
            </ScrollView>

            <PhotoModal
                photoModal={photoModal}
                closePhotoModal={closePhotoModal}
            />

            <ConfirmModal
                visible={!!deleteTarget}
                title={translate('detail.history.deleteTitle')}
                message={translate('detail.history.deleteMessage', {
                    date: deleteTarget?.label ?? '',
                })}
                confirmLabel={translate('detail.history.deleteConfirm')}
                isBusy={!!deletingHistoryId}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => void handleConfirmDelete()}
            />

            <HistoryTransferModal
                visible={isTransferModalVisible}
                sourceMachine={machine}
                onClose={() => setIsTransferModalVisible(false)}
                onContinue={handleSelectTransferTarget}
            />

            <TransferHistoryScopeModal
                sourceName={machine.name}
                target={transferTarget}
                isBusy={isTransferring}
                errorMessage={transferError}
                onCancel={() => {
                    setTransferTarget(null)
                    setTransferError('')
                }}
                onTransfer={(replaceInWorkouts) =>
                    void handleTransfer(replaceInWorkouts)
                }
            />
        </>
    )
}
