import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
} from "react-native";
import { ConfirmModal } from "../../components/ConfirmModal";
import { Input } from "../../components/Input";
import {
    getAuthRequestErrorCode,
    isServiceUnavailableAuthError,
    useAuth,
} from "../../contexts/AuthContext";
import { useI18n } from "../../contexts/I18nContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useFormErrors } from "../../hooks/useFormValidations";
import { getAuthErrorPresentation } from "../../utils/authErrors";

export default function Register() {
    const { t: theme } = useTheme();
    const { t } = useI18n();
    const { register } = useAuth();
    const navigation = useNavigation();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isServiceErrorModalVisible, setIsServiceErrorModalVisible] = useState(false);

    const { errors, setError, clearError, clearAll } = useFormErrors();

    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(40)).current;

    const validate = (): boolean => {
        clearAll();
        let valid = true;

        if (!name.trim()) {
            setError("name", t("auth.validation.nameRequired"));
            valid = false;
        }

        if (!email.trim()) {
            setError("email", t("auth.validation.emailRequired"));
            valid = false;
        } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
            setError("email", t("auth.validation.emailInvalid"));
            valid = false;
        }

        if (!password.trim()) {
            setError("password", t("auth.validation.passwordCreateRequired"));
            valid = false;
        } else if (password.length < 6) {
            setError("password", t("auth.validation.passwordMin"));
            valid = false;
        }

        if (!confirmPassword.trim()) {
            setError("confirmPassword", t("auth.validation.confirmPasswordRequired"));
            valid = false;
        } else if (password !== confirmPassword) {
            setError("confirmPassword", t("auth.validation.passwordMismatch"));
            valid = false;
        }

        return valid;
    };

    const handleRegister = async () => {
        if (!validate() || isSubmitting) return;

        setIsSubmitting(true);

        try {
            await register(name.trim(), email.trim(), password);
        } catch (error) {
            if (isServiceUnavailableAuthError(error)) {
                setIsServiceErrorModalVisible(true);
                return;
            }

            const presentation = getAuthErrorPresentation(getAuthRequestErrorCode(error), "register");
            if (presentation) {
                setError(presentation.field, t(presentation.translationKey));
                return;
            }

            const message =
                error instanceof Error ? error.message : t("auth.errors.genericRegister");

            setError("email", message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const btnColor = theme.mode === "dark" ? "#0d0500" : "#FFF";

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(slide, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fade, slide]);

    const closeServiceErrorModal = () => setIsServiceErrorModalVisible(false);

    return (
        <LinearGradient
            colors={
                theme.mode === "dark"
                    ? ["#1a0a00", "#0d0500", "#060200"]
                    : ["#FAF6F2", "#F5F0EB", "#EDE4DB"]
            }
            style={{ flex: 1 }}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: "center",
                        paddingHorizontal: 28,
                        paddingVertical: 40,
                    }}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 6,
                                marginBottom: 32,
                            }}
                        >
                            <Ionicons name="arrow-back" size={22} color={theme.accent} />
                            <Text style={{ color: theme.accent, fontSize: 15, fontWeight: "700" }}>
                                {t("common.actions.back")}
                            </Text>
                        </TouchableOpacity>

                        <Text
                            style={{
                                fontSize: 28,
                                fontWeight: "900",
                                color: theme.textPrimary,
                                marginBottom: 6,
                            }}
                        >
                            {t("auth.register.title")}
                        </Text>
                        <Text
                            style={{
                                fontSize: 14,
                                color: theme.textMuted,
                                marginBottom: 32,
                                fontWeight: "500",
                            }}
                        >
                            {t("auth.register.subtitle")}
                        </Text>

                        <Input
                            label={t("auth.register.nameLabel")}
                            icon="person-outline"
                            value={name}
                            onChangeText={(value) => {
                                setName(value);
                                clearError("name");
                            }}
                            placeholder={t("auth.register.namePlaceholder")}
                            autoCapitalize="words"
                            error={errors.name}
                        />

                        <Input
                            label={t("auth.register.emailLabel")}
                            icon="mail-outline"
                            value={email}
                            onChangeText={(value) => {
                                setEmail(value);
                                clearError("email");
                            }}
                            placeholder={t("auth.register.emailPlaceholder")}
                            keyboardType="email-address"
                            error={errors.email}
                        />

                        <Input
                            label={t("auth.register.passwordLabel")}
                            icon="lock-closed-outline"
                            value={password}
                            onChangeText={(value) => {
                                setPassword(value);
                                clearError("password");
                            }}
                            placeholder={t("auth.register.passwordPlaceholder")}
                            secure
                            error={errors.password}
                        />

                        <Input
                            label={t("auth.register.confirmPasswordLabel")}
                            icon="shield-checkmark-outline"
                            value={confirmPassword}
                            onChangeText={(value) => {
                                setConfirmPassword(value);
                                clearError("confirmPassword");
                            }}
                            placeholder={t("auth.register.confirmPasswordPlaceholder")}
                            secure
                            error={errors.confirmPassword}
                        />

                        <TouchableOpacity
                            activeOpacity={0.8}
                            disabled={isSubmitting}
                            onPress={handleRegister}
                            style={{ marginTop: 12, opacity: isSubmitting ? 0.8 : 1 }}
                        >
                            <LinearGradient
                                colors={theme.gradientAccent}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{
                                    paddingVertical: 16,
                                    borderRadius: 14,
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ color: btnColor, fontSize: 17, fontWeight: "900" }}>
                                    {isSubmitting
                                        ? t("auth.register.submitting")
                                        : t("auth.register.submit")}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{ marginTop: 20, alignItems: "center", padding: 8 }}
                        >
                            <Text style={{ color: theme.textMuted, fontSize: 14, fontWeight: "500" }}>
                                {t("auth.register.hasAccountPrefix")}{" "}
                                <Text style={{ color: theme.accent, fontWeight: "800" }}>
                                    {t("common.actions.enter")}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            <ConfirmModal
                visible={isServiceErrorModalVisible}
                title={t("auth.errors.serviceUnavailableTitle")}
                message={t("auth.errors.serviceUnavailableMessage")}
                confirmLabel={t("common.actions.understand")}
                hideCancel
                confirmVariant="accent"
                onClose={closeServiceErrorModal}
                onConfirm={closeServiceErrorModal}
            />
        </LinearGradient>
    );
}
