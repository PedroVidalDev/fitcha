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
import { isServiceUnavailableAuthError, useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useFormErrors } from "../../hooks/useFormValidations";

export default function Register() {
    const { t } = useTheme();

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
            setError("name", "Informe seu nome");
            valid = false;
        }

        if (!email.trim()) {
            setError("email", "Informe seu e-mail");
            valid = false;
        } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
            setError("email", "E-mail inválido");
            valid = false;
        }

        if (!password.trim()) {
            setError("password", "Informe uma senha");
            valid = false;
        } else if (password.length < 6) {
            setError("password", "Mínimo de 6 caracteres");
            valid = false;
        }

        if (!confirmPassword.trim()) {
            setError("confirmPassword", "Confirme sua senha");
            valid = false;
        } else if (password !== confirmPassword) {
            setError("confirmPassword", "As senhas não coincidem");
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

            const message =
                error instanceof Error ? error.message : "Não foi possível criar a conta";

            setError("email", message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(slide, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
        ]).start();
    }, []);

    const closeServiceErrorModal = () => setIsServiceErrorModalVisible(false);

    return (
        <LinearGradient
            colors={
                t.mode === "dark"
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
                            <Ionicons name="arrow-back" size={22} color={t.accent} />
                            <Text style={{ color: t.accent, fontSize: 15, fontWeight: "700" }}>
                                Voltar
                            </Text>
                        </TouchableOpacity>

                        <Text
                            style={{
                                fontSize: 28,
                                fontWeight: "900",
                                color: t.textPrimary,
                                marginBottom: 6,
                            }}
                        >
                            Criar conta
                        </Text>
                        <Text
                            style={{
                                fontSize: 14,
                                color: t.textMuted,
                                marginBottom: 32,
                                fontWeight: "500",
                            }}
                        >
                            Preencha seus dados para começar
                        </Text>

                        <Input
                            label="Nome"
                            icon="person-outline"
                            value={name}
                            onChangeText={(v) => {
                                setName(v);
                                clearError("name");
                            }}
                            placeholder="Seu nome"
                            autoCapitalize="words"
                            error={errors.name}
                        />
                        <Input
                            label="E-mail"
                            icon="mail-outline"
                            value={email}
                            onChangeText={(v) => {
                                setEmail(v);
                                clearError("email");
                            }}
                            placeholder="seu@email.com"
                            keyboardType="email-address"
                            error={errors.email}
                        />
                        <Input
                            label="Senha"
                            icon="lock-closed-outline"
                            value={password}
                            onChangeText={(v) => {
                                setPassword(v);
                                clearError("password");
                            }}
                            placeholder="Mínimo 6 caracteres"
                            secure
                            error={errors.password}
                        />
                        <Input
                            label="Confirmar senha"
                            icon="shield-checkmark-outline"
                            value={confirmPassword}
                            onChangeText={(v) => {
                                setConfirmPassword(v);
                                clearError("confirmPassword");
                            }}
                            placeholder="Repita a senha"
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
                                colors={t.gradientAccent}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{
                                    paddingVertical: 16,
                                    borderRadius: 14,
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ color: btnColor, fontSize: 17, fontWeight: "900" }}>
                                    {isSubmitting ? "Criando conta..." : "Criar conta"}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{ marginTop: 20, alignItems: "center", padding: 8 }}
                        >
                            <Text style={{ color: t.textMuted, fontSize: 14, fontWeight: "500" }}>
                                Já tem conta?{" "}
                                <Text style={{ color: t.accent, fontWeight: "800" }}>Entrar</Text>
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
            <ConfirmModal
                visible={isServiceErrorModalVisible}
                title="Serviço indisponível"
                message="O serviço pode estar indisponível no momento. Tente novamente em instantes."
                confirmLabel="Entendi"
                hideCancel
                confirmVariant="accent"
                onClose={closeServiceErrorModal}
                onConfirm={closeServiceErrorModal}
            />
        </LinearGradient>
    );
}
