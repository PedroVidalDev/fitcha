import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useRef } from 'react'
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
} from 'react-native'
import { ConfirmModal } from '../../components/ConfirmModal'
import { Input } from '../../components/Input'
import { useI18n } from '../../contexts/I18nContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useRegisterScreen } from './useRegisterScreen'

export default function Register() {
    const { t: theme } = useTheme()
    const { t } = useI18n()
    const navigation = useNavigation()
    const {
        name,
        email,
        password,
        confirmPassword,
        isSubmitting,
        isServiceErrorModalVisible,
        successMessage,
        errors,
        handleNameChange,
        handleEmailChange,
        handlePasswordChange,
        handleConfirmPasswordChange,
        handleRegister,
        closeServiceErrorModal,
        clearSuccessMessage,
    } = useRegisterScreen()

    const fade = useRef(new Animated.Value(0)).current
    const slide = useRef(new Animated.Value(40)).current

    const btnColor = theme.btnColor

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(slide, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start()
    }, [fade, slide])

    const handleGoBack = useCallback(() => {
        navigation.goBack()
    }, [navigation])

    const closeSuccessModal = useCallback(() => {
        clearSuccessMessage()
        navigation.goBack()
    }, [clearSuccessMessage, navigation])

    return (
        <LinearGradient colors={theme.gradientScreen} style={{ flex: 1 }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'center',
                        paddingHorizontal: 28,
                        paddingVertical: 40,
                    }}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <Animated.View
                        style={{
                            opacity: fade,
                            transform: [{ translateY: slide }],
                        }}
                    >
                        <TouchableOpacity
                            onPress={handleGoBack}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                marginBottom: 32,
                            }}
                        >
                            <Ionicons
                                name='arrow-back'
                                size={22}
                                color={theme.accent}
                            />
                            <Text
                                style={{
                                    color: theme.accent,
                                    fontSize: 15,
                                    fontWeight: '700',
                                }}
                            >
                                {t('common.actions.back')}
                            </Text>
                        </TouchableOpacity>

                        <Text
                            style={{
                                fontSize: 28,
                                fontWeight: '900',
                                color: theme.accent,
                                marginBottom: 6,
                            }}
                        >
                            {t('auth.register.title')}
                        </Text>
                        <Text
                            style={{
                                fontSize: 14,
                                color: theme.textMuted,
                                marginBottom: 32,
                                fontWeight: '500',
                            }}
                        >
                            {t('auth.register.subtitle')}
                        </Text>

                        <Input
                            label={t('auth.register.nameLabel')}
                            icon='person-outline'
                            value={name}
                            onChangeText={handleNameChange}
                            placeholder={t('auth.register.namePlaceholder')}
                            autoCapitalize='words'
                            error={errors.name}
                        />

                        <Input
                            label={t('auth.register.emailLabel')}
                            icon='mail-outline'
                            value={email}
                            onChangeText={handleEmailChange}
                            placeholder={t('auth.register.emailPlaceholder')}
                            keyboardType='email-address'
                            error={errors.email}
                        />

                        <Input
                            label={t('auth.register.passwordLabel')}
                            icon='lock-closed-outline'
                            value={password}
                            onChangeText={handlePasswordChange}
                            placeholder={t('auth.register.passwordPlaceholder')}
                            secure
                            error={errors.password}
                        />

                        <Input
                            label={t('auth.register.confirmPasswordLabel')}
                            icon='shield-checkmark-outline'
                            value={confirmPassword}
                            onChangeText={handleConfirmPasswordChange}
                            placeholder={t(
                                'auth.register.confirmPasswordPlaceholder',
                            )}
                            secure
                            error={errors.confirmPassword}
                        />

                        <TouchableOpacity
                            activeOpacity={0.8}
                            disabled={isSubmitting}
                            onPress={handleRegister}
                            style={{
                                marginTop: 12,
                                opacity: isSubmitting ? 0.8 : 1,
                            }}
                        >
                            <LinearGradient
                                colors={theme.gradientAccent}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{
                                    paddingVertical: 16,
                                    borderRadius: 14,
                                    alignItems: 'center',
                                }}
                            >
                                <Text
                                    style={{
                                        color: btnColor,
                                        fontSize: 17,
                                        fontWeight: '900',
                                    }}
                                >
                                    {isSubmitting
                                        ? t('auth.register.submitting')
                                        : t('auth.register.submit')}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleGoBack}
                            style={{
                                marginTop: 20,
                                alignItems: 'center',
                                padding: 8,
                            }}
                        >
                            <Text
                                style={{
                                    color: theme.textMuted,
                                    fontSize: 14,
                                    fontWeight: '500',
                                }}
                            >
                                {t('auth.register.hasAccountPrefix')}{' '}
                                <Text
                                    style={{
                                        color: theme.accent,
                                        fontWeight: '800',
                                    }}
                                >
                                    {t('common.actions.enter')}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            <ConfirmModal
                visible={isServiceErrorModalVisible}
                title={t('auth.errors.serviceUnavailableTitle')}
                message={t('auth.errors.serviceUnavailableMessage')}
                confirmLabel={t('common.actions.understand')}
                hideCancel
                confirmVariant='accent'
                onClose={closeServiceErrorModal}
                onConfirm={closeServiceErrorModal}
            />

            <ConfirmModal
                visible={!!successMessage}
                title={t('auth.register.successTitle')}
                message={successMessage ?? ''}
                confirmLabel={t('common.actions.enter')}
                hideCancel
                confirmVariant='accent'
                onClose={closeSuccessModal}
                onConfirm={closeSuccessModal}
            />
        </LinearGradient>
    )
}
