import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Input } from "../../components/Input";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useProfileForm } from "./hooks/useProfileForm";

const PLAN_BENEFITS = [
    "Libera o botao do assistente de treino com IA na tela inicial.",
    "Mantem a experiencia de assinatura apenas no frontend por enquanto.",
    "Serve como fluxo ficticio para validar a UX antes do backend real.",
];

export default function ProfileScreen() {
    const { t } = useTheme();
    const { user, updateProfile, setAiPlanActive } = useAuth();

    const { values, errors, isSubmitting, setField, handleSubmit } = useProfileForm({
        user,
        onSubmitProfile: updateProfile,
    });

    if (!user) return null;

    const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";

    const handleSaveProfile = async () => {
        const saved = await handleSubmit();

        if (!saved) return;

        Alert.alert("Perfil salvo", "As alteracoes ficaram armazenadas apenas neste frontend.");
    };

    const handleTogglePlan = async () => {
        const nextValue = !user.hasAiPlan;

        await setAiPlanActive(nextValue);

        Alert.alert(
            nextValue ? "Plano IA ativado" : "Plano IA desativado",
            nextValue
                ? "O botao de IA ja fica disponivel para este usuario."
                : "O botao de IA foi escondido para este usuario.",
        );
    };

    return (
        <LinearGradient colors={t.gradientHero} style={{ flex: 1 }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View
                        style={{
                            backgroundColor: t.inputBg,
                            borderRadius: 24,
                            padding: 20,
                            borderWidth: 0.5,
                            borderColor: t.border,
                            marginBottom: 18,
                        }}
                    >
                        <View
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 999,
                                backgroundColor: t.accent,
                                justifyContent: "center",
                                alignItems: "center",
                                marginBottom: 16,
                            }}
                        >
                            <Text style={{ color: btnColor, fontSize: 20, fontWeight: "900" }}>
                                {user.name.trim().charAt(0).toUpperCase() || "U"}
                            </Text>
                        </View>

                        <Text
                            style={{
                                color: t.textDim,
                                fontSize: 11,
                                fontWeight: "700",
                                textTransform: "uppercase",
                                letterSpacing: 2,
                                marginBottom: 8,
                            }}
                        >
                            perfil
                        </Text>

                        <Text
                            style={{
                                color: t.textPrimary,
                                fontSize: 28,
                                fontWeight: "900",
                                marginBottom: 8,
                            }}
                        >
                            {user.name}
                        </Text>

                        <Text
                            style={{
                                color: t.textMuted,
                                fontSize: 14,
                                lineHeight: 21,
                            }}
                        >
                            Ajuste seu nome, e-mail e senha localmente e controle o acesso ficticio
                            ao plano de IA.
                        </Text>
                    </View>

                    <View
                        style={{
                            backgroundColor: t.inputBg,
                            borderRadius: 24,
                            padding: 20,
                            borderWidth: 0.5,
                            borderColor: t.border,
                            marginBottom: 18,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 16,
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                <View
                                    style={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: 14,
                                        backgroundColor: t.chipBg,
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                >
                                    <Ionicons name="sparkles" size={20} color={t.accent} />
                                </View>
                                <View style={{ flexShrink: 1 }}>
                                    <Text
                                        style={{
                                            color: t.textPrimary,
                                            fontSize: 18,
                                            fontWeight: "800",
                                        }}
                                    >
                                        Fitcha AI
                                    </Text>
                                    <Text style={{ color: t.textMuted, fontSize: 13 }}>
                                        Assinatura ficticia de frontend
                                    </Text>
                                </View>
                            </View>

                            <View
                                style={{
                                    backgroundColor: user.hasAiPlan ? t.accent : t.surface,
                                    borderRadius: 999,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                }}
                            >
                                <Text
                                    style={{
                                        color: user.hasAiPlan ? btnColor : t.textMuted,
                                        fontSize: 11,
                                        fontWeight: "800",
                                        textTransform: "uppercase",
                                        letterSpacing: 1,
                                    }}
                                >
                                    {user.hasAiPlan ? "Ativo" : "Inativo"}
                                </Text>
                            </View>
                        </View>

                        <Text
                            style={{
                                color: t.textMuted,
                                fontSize: 14,
                                lineHeight: 21,
                                marginBottom: 14,
                            }}
                        >
                            Enquanto o backend real nao existe, a assinatura so libera ou esconde o
                            acesso ao recurso de IA dentro do app.
                        </Text>

                        <View style={{ gap: 10, marginBottom: 20 }}>
                            {PLAN_BENEFITS.map((benefit) => (
                                <View
                                    key={benefit}
                                    style={{
                                        flexDirection: "row",
                                        gap: 10,
                                        alignItems: "flex-start",
                                    }}
                                >
                                    <Ionicons
                                        name={
                                            user.hasAiPlan ? "checkmark-circle" : "ellipse-outline"
                                        }
                                        size={18}
                                        color={user.hasAiPlan ? t.accent : t.textDim}
                                        style={{ marginTop: 1 }}
                                    />
                                    <Text
                                        style={{
                                            flex: 1,
                                            color: t.textPrimary,
                                            fontSize: 13,
                                            lineHeight: 19,
                                        }}
                                    >
                                        {benefit}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity activeOpacity={0.8} onPress={handleTogglePlan}>
                            <LinearGradient
                                colors={user.hasAiPlan ? [t.surface, t.inputBg] : t.gradientAccent}
                                style={{
                                    borderRadius: 16,
                                    paddingVertical: 15,
                                    paddingHorizontal: 18,
                                    borderWidth: user.hasAiPlan ? 1 : 0,
                                    borderColor: t.border,
                                }}
                            >
                                <Text
                                    style={{
                                        color: user.hasAiPlan ? t.textPrimary : btnColor,
                                        fontSize: 16,
                                        fontWeight: "900",
                                        textAlign: "center",
                                    }}
                                >
                                    {user.hasAiPlan ? "Cancelar plano IA" : "Assinar plano IA"}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View
                        style={{
                            backgroundColor: t.inputBg,
                            borderRadius: 24,
                            padding: 20,
                            borderWidth: 0.5,
                            borderColor: t.border,
                        }}
                    >
                        <Text
                            style={{
                                color: t.textPrimary,
                                fontSize: 20,
                                fontWeight: "900",
                                marginBottom: 6,
                            }}
                        >
                            Seus dados
                        </Text>
                        <Text
                            style={{
                                color: t.textMuted,
                                fontSize: 13,
                                lineHeight: 20,
                                marginBottom: 20,
                            }}
                        >
                            Essas alteracoes sao ficticias e servem apenas para validar o fluxo no
                            frontend.
                        </Text>

                        <Input
                            label="Nome"
                            icon="person-outline"
                            value={values.name}
                            onChangeText={(value) => setField("name", value)}
                            placeholder="Seu nome"
                            autoCapitalize="words"
                            error={errors.name}
                        />

                        <Input
                            label="E-mail"
                            icon="mail-outline"
                            value={values.email}
                            onChangeText={(value) => setField("email", value)}
                            placeholder="seu@email.com"
                            keyboardType="email-address"
                            error={errors.email}
                        />

                        <Input
                            label="Nova senha"
                            icon="lock-closed-outline"
                            value={values.password}
                            onChangeText={(value) => setField("password", value)}
                            placeholder="Mude apenas se quiser"
                            secure
                            error={errors.password}
                        />

                        <Input
                            label="Confirmar nova senha"
                            icon="shield-checkmark-outline"
                            value={values.confirmPassword}
                            onChangeText={(value) => setField("confirmPassword", value)}
                            placeholder="Repita a nova senha"
                            secure
                            error={errors.confirmPassword}
                        />

                        <TouchableOpacity
                            activeOpacity={0.8}
                            disabled={isSubmitting}
                            onPress={handleSaveProfile}
                            style={{ marginTop: 8, opacity: isSubmitting ? 0.8 : 1 }}
                        >
                            <LinearGradient
                                colors={t.gradientAccent}
                                style={{
                                    borderRadius: 16,
                                    paddingVertical: 16,
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ color: btnColor, fontSize: 16, fontWeight: "900" }}>
                                    {isSubmitting ? "Salvando..." : "Salvar alteracoes"}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}
