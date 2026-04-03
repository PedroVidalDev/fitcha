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
import { Input } from "../../components/Input";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useFormErrors } from "../../hooks/useFormValidations";

export default function Login() {
    const { t } = useTheme();
    const { login } = useAuth();
    const navigation = useNavigation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { errors, setError, clearError, clearAll } = useFormErrors();

    const logoFade = useRef(new Animated.Value(0)).current;
    const logoSlide = useRef(new Animated.Value(-30)).current;
    const formFade = useRef(new Animated.Value(0)).current;
    const formSlide = useRef(new Animated.Value(40)).current;

    const validate = (): boolean => {
        clearAll();
        let valid = true;

        if (!email.trim()) {
            setError("email", "Informe seu e-mail");
            valid = false;
        } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
            setError("email", "E-mail inválido");
            valid = false;
        }

        if (!password.trim()) {
            setError("password", "Informe sua senha");
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
            const message =
                error instanceof Error ? error.message : "E-mail ou senha incorretos";

            setError("password", message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";

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
    }, []);

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
                            backgroundColor: t.accent,
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
                            color: t.textPrimary,
                            letterSpacing: -1,
                        }}
                    >
                        Fitcha
                    </Text>
                    <Text
                        style={{
                            fontSize: 14,
                            color: t.textMuted,
                            marginTop: 4,
                            fontWeight: "500",
                        }}
                    >
                        Sua ficha de treino digital
                    </Text>
                </Animated.View>

                <Animated.View
                    style={{ opacity: formFade, transform: [{ translateY: formSlide }] }}
                >
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
                        placeholder="••••••••"
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
                            colors={t.gradientAccent}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ paddingVertical: 16, borderRadius: 14, alignItems: "center" }}
                        >
                            <Text style={{ color: btnColor, fontSize: 17, fontWeight: "900" }}>
                                {isSubmitting ? "Entrando..." : "Entrar"}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View
                        style={{ flexDirection: "row", alignItems: "center", marginVertical: 28 }}
                    >
                        <View style={{ flex: 1, height: 0.5, backgroundColor: t.border }} />
                        <Text
                            style={{
                                color: t.textDim,
                                fontSize: 12,
                                marginHorizontal: 14,
                                fontWeight: "600",
                            }}
                        >
                            ou
                        </Text>
                        <View style={{ flex: 1, height: 0.5, backgroundColor: t.border }} />
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.navigate("Register")}
                        activeOpacity={0.7}
                        style={{
                            paddingVertical: 16,
                            borderRadius: 14,
                            alignItems: "center",
                            borderWidth: 1,
                            borderColor: t.accent,
                        }}
                    >
                        <Text style={{ color: t.accent, fontSize: 16, fontWeight: "800" }}>
                            Criar conta
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}
