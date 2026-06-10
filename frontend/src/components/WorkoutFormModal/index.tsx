import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { useI18n } from '../../contexts/I18nContext'
import { useTheme } from '../../contexts/ThemeContext'
import { AppModal } from '../AppModal'
import { WorkoutFormModalProps } from './types'

export function WorkoutFormModal(props: WorkoutFormModalProps) {
    const {
        visible,
        title,
        initialName = '',
        initialDescription = '',
        submitLabel,
        onClose,
        onSubmit,
    } = props

    const { t } = useTheme()
    const { t: translate } = useI18n()

    const [name, setName] = useState(initialName)
    const [description, setDescription] = useState(initialDescription)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const btnColor = t.mode === 'dark' ? '#0d0500' : '#FFF'

    useEffect(() => {
        if (!visible) return

        setName(initialName)
        setDescription(initialDescription)
        setIsSubmitting(false)
        setErrorMessage('')
    }, [initialDescription, initialName, visible])

    const handleSubmit = async () => {
        const trimmedName = name.trim()
        if (!trimmedName) {
            setErrorMessage(translate('workoutForm.nameRequired'))
            return
        }

        try {
            setIsSubmitting(true)
            setErrorMessage('')
            await onSubmit(trimmedName, description.trim())
            onClose()
        } catch (error) {
            if (error instanceof Error && error.message.trim()) {
                setErrorMessage(error.message)
            } else {
                setErrorMessage(translate('workoutForm.genericError'))
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AppModal
            visible={visible}
            onClose={onClose}
            overlayPadding={16}
            compact
        >
            <ScrollView
                keyboardShouldPersistTaps='handled'
                contentContainerStyle={{ paddingBottom: 8 }}
                showsVerticalScrollIndicator={false}
            >
                <Text
                    style={{
                        color: t.accent,
                        fontSize: 20,
                        fontWeight: '800',
                        marginBottom: 18,
                    }}
                >
                    {title}
                </Text>

                <Text
                    style={{
                        color: t.textDim,
                        fontSize: 11,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        marginBottom: 6,
                    }}
                >
                    {translate('workoutForm.nameLabel')}
                </Text>
                <TextInput
                    style={{
                        backgroundColor: t.inputBg,
                        borderRadius: 12,
                        padding: 14,
                        color: t.textPrimary,
                        fontSize: 16,
                        borderWidth: 0.5,
                        borderColor: t.border,
                        marginBottom: 16,
                    }}
                    placeholder={translate('workoutForm.namePlaceholder')}
                    placeholderTextColor={t.textDim}
                    value={name}
                    onChangeText={setName}
                    autoFocus
                />

                <Text
                    style={{
                        color: t.textDim,
                        fontSize: 11,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        marginBottom: 6,
                    }}
                >
                    {translate('workoutForm.descriptionLabel')}
                </Text>
                <TextInput
                    style={{
                        backgroundColor: t.inputBg,
                        borderRadius: 12,
                        padding: 14,
                        color: t.textPrimary,
                        fontSize: 15,
                        borderWidth: 0.5,
                        borderColor: t.border,
                        minHeight: 112,
                        textAlignVertical: 'top',
                    }}
                    placeholder={translate(
                        'workoutForm.descriptionPlaceholder',
                    )}
                    placeholderTextColor={t.textDim}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />

                {errorMessage ? (
                    <Text
                        style={{
                            color: '#EF5350',
                            fontSize: 12,
                            fontWeight: '600',
                            marginTop: 10,
                        }}
                    >
                        {errorMessage}
                    </Text>
                ) : null}
            </ScrollView>

            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    gap: 12,
                    marginTop: 18,
                }}
            >
                <TouchableOpacity onPress={onClose} style={{ padding: 12 }}>
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 15,
                            fontWeight: '600',
                        }}
                    >
                        {translate('common.actions.cancel')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => void handleSubmit()}
                    activeOpacity={0.75}
                    disabled={isSubmitting}
                    style={{ opacity: isSubmitting ? 0.7 : 1 }}
                >
                    <LinearGradient
                        colors={t.gradientAccent}
                        style={{
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            borderRadius: 12,
                        }}
                    >
                        <Text
                            style={{
                                color: btnColor,
                                fontSize: 15,
                                fontWeight: '800',
                            }}
                        >
                            {isSubmitting
                                ? translate('workoutForm.saving')
                                : submitLabel}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </AppModal>
    )
}
