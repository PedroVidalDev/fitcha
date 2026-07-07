import { RootStackParamList } from '@/src/router/types'
import { useMachineHistory } from '@/src/screens/Detail/hooks/useMachineHistory'
import { useMachinePhoto } from '@/src/screens/Detail/hooks/useMachinePhoto'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import { useEffect, useState } from 'react'
import { ScrollView } from 'react-native'
import { useI18n } from '../../contexts/I18nContext'
import { useTheme } from '../../contexts/ThemeContext'
import { MachineHistorySection } from './components/MachineHistorySection'
import { MachineIntro } from './components/MachineIntro'
import { MachinePhotoCard } from './components/MachinePhotoCard'
import { MachineStatsCarousel } from './components/MachineStatsCarousel'
import { PhotoModal } from './components/PhotoModal'
import { PhotoModalState } from './components/PhotoModal/types'

type Route = RouteProp<RootStackParamList, 'MachineDetail'>

export default function MachineDetailScreen() {
    const { t } = useTheme()
    const { t: translate } = useI18n()

    const route = useRoute<Route>()
    const navigation = useNavigation()
    const { machineId } = route.params

    const { machine, history } = useMachineHistory(machineId)
    const { photo, updatePhoto, removePhoto } = useMachinePhoto(machineId)

    const [photoModal, setPhotoModal] = useState<PhotoModalState | null>(null)

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

    useEffect(() => {
        if (machine?.name) {
            navigation.setOptions({ title: machine.name })
        }
    }, [machine?.name, navigation])

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
                <MachineStatsCarousel machine={machine} history={history} />
                <MachineHistorySection machine={machine} history={history} />
            </ScrollView>

            <PhotoModal
                photoModal={photoModal}
                closePhotoModal={closePhotoModal}
            />
        </>
    )
}
