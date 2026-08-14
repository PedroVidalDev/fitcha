import { MACHINE_CATEGORIES } from '@/src/constants/categories'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { MachineCategoryKey } from '@/src/constants/categories'
import { MachineTrackingType } from '@/src/dtos/Machine'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { AppModal } from '../AppModal'
import { Input } from '../Input'
import { MachineImage } from '../MachineImage'
import { CustomMachineFormModalProps } from './types'

export function CustomMachineFormModal(props: CustomMachineFormModalProps) {
    const { visible, machine, onClose, onSubmit } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [photo, setPhoto] = useState<string>()
    const [categoryKey, setCategoryKey] = useState<MachineCategoryKey>('peito')
    const [trackingType, setTrackingType] =
        useState<MachineTrackingType>('sets')
    const [requiresWeight, setRequiresWeight] = useState(true)
    const [nameError, setNameError] = useState('')
    const [formError, setFormError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (!visible) return

        setName(machine?.name ?? '')
        setDescription(machine?.description ?? '')
        setPhoto(machine?.photo)
        setCategoryKey(machine?.categoryKey ?? 'peito')
        setTrackingType(machine?.trackingType ?? 'sets')
        setRequiresWeight(machine?.requiresWeight ?? true)
        setNameError('')
        setFormError('')
        setIsSubmitting(false)
    }, [machine, visible])

    const handleTrackingTypeChange = (value: MachineTrackingType) => {
        setTrackingType(value)
        if (value === 'duration') setRequiresWeight(false)
    }

    const handleChoosePhoto = async () => {
        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (permission.status !== 'granted') {
            setFormError(translate('customMachines.form.galleryPermission'))
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        })
        if (!result.canceled && result.assets[0]) {
            setPhoto(result.assets[0].uri)
            setFormError('')
        }
    }

    const handleSubmit = async () => {
        const normalizedName = name.trim()
        if (!normalizedName) {
            setNameError(translate('customMachines.form.nameRequired'))
            return
        }

        setNameError('')
        setFormError('')
        setIsSubmitting(true)

        try {
            await onSubmit({
                name: normalizedName,
                description: description.trim(),
                photo: photo ?? '',
                categoryKey,
                trackingType,
                requiresWeight:
                    trackingType === 'duration' ? false : requiresWeight,
            })
            onClose()
        } catch (error) {
            setFormError(
                error instanceof Error
                    ? error.message
                    : translate('customMachines.form.saveError'),
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AppModal
            visible={visible}
            onClose={isSubmitting ? () => undefined : onClose}
            overlayPadding={10}
            contentStyle={{ minHeight: '88%', maxHeight: '96%' }}
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps='handled'
                contentContainerStyle={{ paddingBottom: 8 }}
            >
                <Text
                    style={{
                        color: t.accent,
                        fontSize: 22,
                        fontWeight: '900',
                        marginBottom: 5,
                    }}
                >
                    {translate(
                        machine
                            ? 'customMachines.form.editTitle'
                            : 'customMachines.form.createTitle',
                    )}
                </Text>
                <Text
                    style={{
                        color: t.textMuted,
                        fontSize: 13,
                        lineHeight: 19,
                        marginBottom: 20,
                    }}
                >
                    {translate('customMachines.form.subtitle')}
                </Text>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => void handleChoosePhoto()}
                    style={{
                        height: 126,
                        borderRadius: 16,
                        overflow: 'hidden',
                        backgroundColor: t.inputBg,
                        borderWidth: 1,
                        borderColor: t.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 18,
                    }}
                >
                    {photo ? (
                        <MachineImage
                            uri={photo}
                            style={{ width: '100%', height: '100%' }}
                        />
                    ) : (
                        <View style={{ alignItems: 'center', gap: 7 }}>
                            <Ionicons
                                name='camera-outline'
                                size={28}
                                color={t.accent}
                            />
                            <Text
                                style={{
                                    color: t.textDim,
                                    fontSize: 12,
                                    fontWeight: '700',
                                }}
                            >
                                {translate('customMachines.form.choosePhoto')}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                {photo ? (
                    <TouchableOpacity
                        onPress={() => setPhoto(undefined)}
                        style={{
                            alignSelf: 'flex-end',
                            marginTop: -10,
                            marginBottom: 12,
                        }}
                    >
                        <Text
                            style={{
                                color: '#EF5350',
                                fontSize: 12,
                                fontWeight: '800',
                            }}
                        >
                            {translate('customMachines.form.removePhoto')}
                        </Text>
                    </TouchableOpacity>
                ) : null}

                <Input
                    label={translate('customMachines.form.name')}
                    value={name}
                    onChangeText={(value) => {
                        setName(value)
                        if (nameError) setNameError('')
                    }}
                    placeholder={translate(
                        'customMachines.form.namePlaceholder',
                    )}
                    icon='barbell-outline'
                    autoCapitalize='sentences'
                    error={nameError}
                />

                <Text
                    style={{
                        color: t.textMuted,
                        fontSize: 12,
                        fontWeight: '700',
                        marginBottom: 8,
                        marginLeft: 4,
                    }}
                >
                    {translate('customMachines.form.description')}
                </Text>
                <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder={translate(
                        'customMachines.form.descriptionPlaceholder',
                    )}
                    placeholderTextColor={t.textDim}
                    multiline
                    maxLength={500}
                    style={{
                        minHeight: 92,
                        borderRadius: 14,
                        backgroundColor: t.inputBg,
                        borderWidth: 0.5,
                        borderColor: t.border,
                        color: t.textPrimary,
                        padding: 14,
                        textAlignVertical: 'top',
                        fontSize: 14,
                        marginBottom: 18,
                    }}
                />

                <Text
                    style={{
                        color: t.textMuted,
                        fontSize: 12,
                        fontWeight: '700',
                        marginBottom: 10,
                        marginLeft: 4,
                    }}
                >
                    {translate('customMachines.form.category')}
                </Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingBottom: 18 }}
                >
                    {MACHINE_CATEGORIES.map((category) => {
                        const selected = category.key === categoryKey
                        return (
                            <TouchableOpacity
                                key={category.key}
                                onPress={() => setCategoryKey(category.key)}
                                style={{
                                    paddingHorizontal: 13,
                                    paddingVertical: 9,
                                    borderRadius: 999,
                                    backgroundColor: selected
                                        ? t.accent
                                        : t.inputBg,
                                    borderWidth: 1,
                                    borderColor: selected ? t.accent : t.border,
                                }}
                            >
                                <Text
                                    style={{
                                        color: selected
                                            ? t.btnColor
                                            : t.textMuted,
                                        fontSize: 12,
                                        fontWeight: '800',
                                    }}
                                >
                                    {translate(category.labelKey)}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>

                <Text
                    style={{
                        color: t.textMuted,
                        fontSize: 12,
                        fontWeight: '700',
                        marginBottom: 10,
                        marginLeft: 4,
                    }}
                >
                    {translate('customMachines.form.trackingType')}
                </Text>
                <View
                    style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}
                >
                    {(['sets', 'duration'] as const).map((value) => {
                        const selected = trackingType === value
                        return (
                            <TouchableOpacity
                                key={value}
                                onPress={() => handleTrackingTypeChange(value)}
                                style={{
                                    flex: 1,
                                    padding: 13,
                                    borderRadius: 13,
                                    backgroundColor: selected
                                        ? t.chipBg
                                        : t.inputBg,
                                    borderWidth: 1,
                                    borderColor: selected ? t.accent : t.border,
                                    alignItems: 'center',
                                }}
                            >
                                <Text
                                    style={{
                                        color: selected
                                            ? t.accent
                                            : t.textMuted,
                                        fontSize: 13,
                                        fontWeight: '800',
                                    }}
                                >
                                    {translate(
                                        value === 'sets'
                                            ? 'customMachines.form.sets'
                                            : 'customMachines.form.duration',
                                    )}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>

                {trackingType === 'sets' ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 14,
                            borderRadius: 14,
                            backgroundColor: t.inputBg,
                            borderWidth: 0.5,
                            borderColor: t.border,
                            marginBottom: 18,
                        }}
                    >
                        <View style={{ flex: 1, paddingRight: 12 }}>
                            <Text
                                style={{
                                    color: t.textPrimary,
                                    fontSize: 14,
                                    fontWeight: '800',
                                }}
                            >
                                {translate(
                                    'customMachines.form.requiresWeight',
                                )}
                            </Text>
                            <Text
                                style={{
                                    color: t.textDim,
                                    fontSize: 12,
                                    lineHeight: 17,
                                    marginTop: 3,
                                }}
                            >
                                {translate(
                                    'customMachines.form.requiresWeightHint',
                                )}
                            </Text>
                        </View>
                        <Switch
                            value={requiresWeight}
                            onValueChange={setRequiresWeight}
                            trackColor={{ false: t.border, true: t.accent }}
                            thumbColor={t.btnColor}
                        />
                    </View>
                ) : null}

                {formError ? (
                    <Text
                        style={{
                            color: '#EF5350',
                            fontSize: 13,
                            lineHeight: 18,
                            textAlign: 'center',
                            marginBottom: 14,
                        }}
                    >
                        {formError}
                    </Text>
                ) : null}

                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        gap: 10,
                    }}
                >
                    <TouchableOpacity
                        disabled={isSubmitting}
                        onPress={onClose}
                        style={{ paddingHorizontal: 16, paddingVertical: 13 }}
                    >
                        <Text
                            style={{
                                color: t.textMuted,
                                fontSize: 14,
                                fontWeight: '700',
                            }}
                        >
                            {translate('common.actions.cancel')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        disabled={isSubmitting}
                        onPress={() => void handleSubmit()}
                        activeOpacity={0.78}
                    >
                        <LinearGradient
                            colors={t.gradientAccent}
                            style={{
                                minWidth: 118,
                                minHeight: 46,
                                borderRadius: 13,
                                paddingHorizontal: 18,
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: isSubmitting ? 0.75 : 1,
                            }}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color={t.btnColor} />
                            ) : (
                                <Text
                                    style={{
                                        color: t.btnColor,
                                        fontSize: 14,
                                        fontWeight: '900',
                                    }}
                                >
                                    {translate('common.actions.save')}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </AppModal>
    )
}
