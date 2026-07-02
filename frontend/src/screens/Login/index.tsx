import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef } from 'react'
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { AppModal } from '../../components/AppModal'
import { ConfirmModal } from '../../components/ConfirmModal'
import { Input } from '../../components/Input'
import { useI18n } from '../../contexts/I18nContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useLoginScreen } from './useLoginScreen'

export default function Login() {
    const { t: theme } = useTheme()
    const { t } = useI18n()
    const navigation = useNavigation()
    const {
        email,
        errors,
        password,
        handleLogin,
        isSubmitting,
        handleEmailChange,
        forgotPasswordEmail,
        forgotPasswordError,
        handlePasswordChange,
        handleForgotPassword,
        closeServiceErrorModal,
        openForgotPasswordModal,
        closeForgotPasswordModal,
        isRequestingPasswordReset,
        isServiceErrorModalVisible,
        passwordResetSuccessMessage,
        isForgotPasswordModalVisible,
        closePasswordResetSuccessModal,
        handleForgotPasswordEmailChange,
    } = useLoginScreen()

    const logoFade = useRef(new Animated.Value(0)).current
    const logoSlide = useRef(new Animated.Value(-30)).current
    const formFade = useRef(new Animated.Value(0)).current
    const formSlide = useRef(new Animated.Value(40)).current

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.timing(logoFade, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(logoSlide, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(formFade, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(formSlide, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]),
        ]).start()
    }, [formFade, formSlide, logoFade, logoSlide])

    return (
        <LinearGradient colors={theme.gradientScreen} style={{ flex: 1 }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    paddingHorizontal: 28,
                }}
            >
                <Animated.View
                    style={{
                        alignItems: 'center',
                        marginBottom: 48,
                        opacity: logoFade,
                        transform: [{ translateY: logoSlide }],
                    }}
                >
                    <View
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: 24,
                            backgroundColor: theme.accent,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 16,
                        }}
                    >
                        <Ionicons
                            name='barbell'
                            size={40}
                            color={theme.btnColor}
                        />
                    </View>
                    <Text
                        style={{
                            fontSize: 32,
                            fontWeight: '900',
                            color: theme.accent,
                            letterSpacing: -1,
                        }}
                    >
                        Fitcha
                    </Text>
                    <Text
                        style={{
                            fontSize: 14,
                            color: theme.textMuted,
                            marginTop: 4,
                            fontWeight: '500',
                        }}
                    >
                        {t('app.tagline')}
                    </Text>
                </Animated.View>

                <Animated.View
                    style={{
                        opacity: formFade,
                        transform: [{ translateY: formSlide }],
                    }}
                >
                    <Input
                        label={t('auth.login.emailLabel')}
                        icon='mail-outline'
                        value={email}
                        onChangeText={handleEmailChange}
                        placeholder={t('auth.login.emailPlaceholder')}
                        keyboardType='email-address'
                        error={errors.email}
                    />

                    <Input
                        label={t('auth.login.passwordLabel')}
                        icon='lock-closed-outline'
                        value={password}
                        onChangeText={handlePasswordChange}
                        placeholder={t('auth.login.passwordPlaceholder')}
                        secure
                        error={errors.password}
                    />

                    <TouchableOpacity
                        onPress={openForgotPasswordModal}
                        activeOpacity={0.7}
                        style={{
                            alignSelf: 'flex-end',
                            marginTop: -4,
                            marginBottom: 8,
                            padding: 6,
                        }}
                    >
                        <Text
                            style={{
                                color: theme.accent,
                                fontSize: 13,
                                fontWeight: '700',
                            }}
                        >
                            {t('auth.login.forgotPasswordCta')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        disabled={isSubmitting}
                        onPress={handleLogin}
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
                                    color: theme.btnColor,
                                    fontSize: 17,
                                    fontWeight: '900',
                                }}
                            >
                                {isSubmitting
                                    ? t('auth.login.submitting')
                                    : t('auth.login.submit')}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginVertical: 28,
                        }}
                    >
                        <View
                            style={{
                                flex: 1,
                                height: 0.5,
                                backgroundColor: theme.border,
                            }}
                        />
                        <Text
                            style={{
                                color: theme.textDim,
                                fontSize: 12,
                                marginHorizontal: 14,
                                fontWeight: '600',
                            }}
                        >
                            {t('common.or')}
                        </Text>
                        <View
                            style={{
                                flex: 1,
                                height: 0.5,
                                backgroundColor: theme.border,
                            }}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Register')}
                        activeOpacity={0.7}
                        style={{
                            paddingVertical: 16,
                            borderRadius: 14,
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: theme.accent,
                        }}
                    >
                        <Text
                            style={{
                                color: theme.accent,
                                fontSize: 16,
                                fontWeight: '800',
                            }}
                        >
                            {t('auth.login.createAccountCta')}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
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

            <AppModal
                visible={isForgotPasswordModalVisible}
                onClose={closeForgotPasswordModal}
                compact
            >
                <Text
                    style={{
                        color: theme.accent,
                        fontSize: 20,
                        fontWeight: '800',
                        marginBottom: 10,
                    }}
                >
                    {t('auth.resetPassword.title')}
                </Text>
                <Text
                    style={{
                        color: theme.textMuted,
                        fontSize: 14,
                        lineHeight: 20,
                        marginBottom: 18,
                    }}
                >
                    {t('auth.resetPassword.description')}
                </Text>

                <Input
                    label={t('auth.login.emailLabel')}
                    icon='mail-outline'
                    value={forgotPasswordEmail}
                    onChangeText={handleForgotPasswordEmailChange}
                    placeholder={t('auth.login.emailPlaceholder')}
                    keyboardType='email-address'
                    error={forgotPasswordError}
                />

                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        gap: 12,
                        marginTop: 8,
                    }}
                >
                    <TouchableOpacity
                        onPress={closeForgotPasswordModal}
                        disabled={isRequestingPasswordReset}
                        style={{
                            padding: 12,
                            justifyContent: 'center',
                            opacity: isRequestingPasswordReset ? 0.7 : 1,
                        }}
                    >
                        <Text
                            style={{
                                color: theme.textMuted,
                                fontSize: 15,
                                fontWeight: '600',
                            }}
                        >
                            {t('common.actions.cancel')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleForgotPassword}
                        activeOpacity={0.75}
                        disabled={isRequestingPasswordReset}
                        style={{ opacity: isRequestingPasswordReset ? 0.8 : 1 }}
                    >
                        <LinearGradient
                            colors={theme.gradientAccent}
                            style={{
                                paddingHorizontal: 24,
                                paddingVertical: 12,
                                borderRadius: 12,
                            }}
                        >
                            <Text
                                style={{
                                    color: theme.btnColor,
                                    fontSize: 15,
                                    fontWeight: '800',
                                }}
                            >
                                {isRequestingPasswordReset
                                    ? t('auth.resetPassword.submitting')
                                    : t('auth.resetPassword.submit')}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </AppModal>

            <ConfirmModal
                visible={!!passwordResetSuccessMessage}
                title={t('auth.resetPassword.successTitle')}
                message={passwordResetSuccessMessage ?? ''}
                confirmLabel={t('common.actions.understand')}
                hideCancel
                confirmVariant='accent'
                onClose={closePasswordResetSuccessModal}
                onConfirm={closePasswordResetSuccessModal}
            />
        </LinearGradient>
    )
}
