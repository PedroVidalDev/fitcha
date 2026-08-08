import { MachineImage } from '@/src/components/MachineImage'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { Text, TouchableOpacity, View } from 'react-native'
import { MachinePhotoCardProps } from './types'

export function MachinePhotoCard(props: MachinePhotoCardProps) {
    const { photo, onPress } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
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
                <MachineImage
                    uri={photo}
                    priority='high'
                    style={{ width: '100%', height: '100%' }}
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
    )
}
