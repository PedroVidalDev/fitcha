import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    Text,
    TouchableOpacity,
    View,
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

export default function Login() {
    const { t: theme } = useTheme();
    const { t } = useI18n();
    const { login } = useAuth();
    const navigation = useNavigation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isServiceErrorModalVisible, setIsServiceErrorModalVisible] = useState(false);

    const { errors, setError, clearError, clearAll } = useFormErrors();

    const logoFade = useRef(new Animated.Value(0)).current;
    const logoSlide = useRef(new Animated.Value(-30)).current;
    const formFade = useRef(new Animated.Value(0)).current;
    const formSlide = useRef(new Animated.Value(40)).current;

    const validate = (): boolean => {
        clearAll();
        let valid = true;

        if (!email.trim()) {
            setError("email", t("auth.validation.emailRequired"));
            valid = false;
        } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
            setError("email", t("auth.validation.emailInvalid"));
            valid = false;
        }

        if (!password.trim()) {
            setError("password", t("auth.validation.passwordRequired"));
            valid = false;
        }

        return valid;
    };

    const handleLogin = async () => {
        if (!validate() || isSubmitting) return;

        setIsSubmitting(true);

        try {
            await login(email.trim(), password);
        } catch (error) {
            if (isServiceUnavailableAuthError(error)) {
                setIsServiceErrorModalVisible(true);
                return;
            }

            const presentation = getAuthErrorPresentation(getAuthRequestErrorCode(error), "login");
            if (presentation) {
                setError(presentation.field, t(presentation.translationKey));
                return;
            }

            const message =
                error instanceof Error ? error.message : t("auth.errors.genericLogin");

            setError("password", message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const btnColor = theme.mode === "dark" ? "#0d0500" : "#FFF";

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.timing(logoFade, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.spring(logoSlide, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(formFade, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.spring(formSlide, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, [formFade, formSlide, logoFade, logoSlide]);

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
                style={{ flex: 1, justifyContent: "center", paddingHorizontal: 28 }}
            >
                <Animated.View
                    style={{
                        alignItems: "center",
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
                            justifyContent: "center",
                            alignItems: "center",
                            marginBottom: 16,
                        }}
                    >
                        <Ionicons name="barbell" size={40} color={btnColor} />
                    </View>
                    <Text
                        style={{
                            fontSize: 32,
                            fontWeight: "900",
                            color: theme.textPrimary,
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
                            fontWeight: "500",
                        }}
                    >
                        {t("app.tagline")}
                    </Text>
                </Animated.View>

                <Animated.View style={{ opacity: formFade, transform: [{ translateY: formSlide }] }}>
                    <Input
                        label={t("auth.login.emailLabel")}
                        icon="mail-outline"
                        value={email}
                        onChangeText={(value) => {
                            setEmail(value);
                            clearError("email");
                        }}
                        placeholder={t("auth.login.emailPlaceholder")}
                        keyboardType="email-address"
                        error={errors.email}
                    />

                    <Input
                        label={t("auth.login.passwordLabel")}
                        icon="lock-closed-outline"
                        value={password}
                        onChangeText={(value) => {
                            setPassword(value);
                            clearError("password");
                        }}
                        placeholder={t("auth.login.passwordPlaceholder")}
                        secure
                        error={errors.password}
                    />

                    <TouchableOpacity
                        activeOpacity={0.8}
                        disabled={isSubmitting}
                        onPress={handleLogin}
                        style={{ marginTop: 12, opacity: isSubmitting ? 0.8 : 1 }}
                    >
                        <LinearGradient
                            colors={theme.gradientAccent}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ paddingVertical: 16, borderRadius: 14, alignItems: "center" }}
                        >
                            <Text style={{ color: btnColor, fontSize: 17, fontWeight: "900" }}>
                                {isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View
                        style={{ flexDirection: "row", alignItems: "center", marginVertical: 28 }}
                    >
                        <View style={{ flex: 1, height: 0.5, backgroundColor: theme.border }} />
                        <Text
                            style={{
                                color: theme.textDim,
                                fontSize: 12,
                                marginHorizontal: 14,
                                fontWeight: "600",
                            }}
                        >
                            {t("common.or")}
                        </Text>
                        <View style={{ flex: 1, height: 0.5, backgroundColor: theme.border }} />
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.navigate("Register")}
                        activeOpacity={0.7}
                        style={{
                            paddingVertical: 16,
                            borderRadius: 14,
                            alignItems: "center",
                            borderWidth: 1,
                            borderColor: theme.accent,
                        }}
                    >
                        <Text style={{ color: theme.accent, fontSize: 16, fontWeight: "800" }}>
                            {t("auth.login.createAccountCta")}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
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
