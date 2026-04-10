import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Input } from "../../components/Input";
import { PlanCheckoutModal } from "../../components/PlanCheckoutModal";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { usePlanCheckout } from "./hooks/usePlanCheckout";
import { useProfileForm } from "./hooks/useProfileForm";
import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";

const PLAN_BENEFITS = [
    "Libera o botão do assistente de treino com IA na tela inicial.",
    "Ativação automática assim que o Pix for confirmado pelo Mercado Pago.",
    "Acesso garantido por 1 mês sem cancelamento manual durante a vigência.",
];

function formatDate(value?: string | null) {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return null;

    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export default function ProfileScreen() {
    const { t } = useTheme();
    const { user, updateProfile, setAiPlanActive } = useAuth();

    const { values, errors, isSubmitting, setField, handleSubmit } = useProfileForm({
        user,
        onSubmitProfile: updateProfile,
    });

    const {
        plan,
        documentNumber,
        setDocumentNumber,
        isModalVisible,
        isLoading,
        isCreatingCheckout,
        isRefreshingStatus,
        errorMessage,
        openModal,
        closeModal,
        generateCheckout,
        refreshStatus,
        reloadPlan,
    } = usePlanCheckout({
        onPlanActiveChange: setAiPlanActive,
    });

    if (!user) return null;

    const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";
    const accessExpiresAt = formatDate(plan?.accessExpiresAt);
    const paymentExpiresAt = formatDate(plan?.paymentExpiresAt);
    const hasPendingPayment = plan?.status === "pending";

    const handleSaveProfile = async () => {
        const saved = await handleSubmit();

        if (!saved) return;

        Alert.alert("Perfil salvo", "As alterações ficaram armazenadas apenas neste frontend.");
    };

    const handleRefreshPlan = useCallback(() => {
        void reloadPlan();
    }, [reloadPlan]);

    useFocusEffect(handleRefreshPlan);

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
                            Ajuste seu nome, e-mail e senha localmente e acompanhe a assinatura do
                            plano que libera o modo AI.
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
                            <View
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 10,
                                }}
                            >
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
                                        Plano mensal com pagamento via Pix
                                    </Text>
                                </View>
                            </View>

                            <View
                                style={{
                                    backgroundColor: user.hasAiPlan ? t.accent : t.surface,
                                    borderRadius: 999,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    marginLeft: 12,
                                    flexShrink: 0,
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
                            O acesso ao AI é liberado automaticamente quando o pagamento Pix for
                            aprovado e permanece ativo por 1 mês.
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

                        {isLoading ? (
                            <View style={{ paddingVertical: 18, alignItems: "center" }}>
                                <ActivityIndicator color={t.accent} />
                            </View>
                        ) : user.hasAiPlan ? (
                            <View
                                style={{
                                    backgroundColor: t.chipBg,
                                    borderRadius: 16,
                                    padding: 16,
                                }}
                            >
                                <Text
                                    style={{
                                        color: t.textPrimary,
                                        fontSize: 16,
                                        fontWeight: "900",
                                        marginBottom: 6,
                                    }}
                                >
                                    Plano ativo
                                </Text>
                                <Text style={{ color: t.textMuted, fontSize: 14, lineHeight: 21 }}>
                                    {accessExpiresAt
                                        ? `Válido até ${accessExpiresAt}. Durante esse período não há opção de cancelamento manual.`
                                        : "Seu acesso ao AI já foi liberado no app."}
                                </Text>
                            </View>
                        ) : hasPendingPayment ? (
                            <View style={{ gap: 12 }}>
                                <View
                                    style={{
                                        backgroundColor: t.chipBg,
                                        borderRadius: 16,
                                        padding: 16,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: t.textPrimary,
                                            fontSize: 16,
                                            fontWeight: "900",
                                            marginBottom: 6,
                                        }}
                                    >
                                        Pagamento pendente
                                    </Text>
                                    <Text
                                        style={{ color: t.textMuted, fontSize: 14, lineHeight: 21 }}
                                    >
                                        {paymentExpiresAt
                                            ? `Existe um Pix aguardando pagamento até ${paymentExpiresAt}.`
                                            : "Existe um Pix aguardando pagamento para ativar o modo AI."}
                                    </Text>
                                </View>

                                <TouchableOpacity activeOpacity={0.8} onPress={openModal}>
                                    <LinearGradient
                                        colors={t.gradientAccent}
                                        style={{
                                            borderRadius: 16,
                                            paddingVertical: 15,
                                            paddingHorizontal: 18,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: btnColor,
                                                fontSize: 16,
                                                fontWeight: "900",
                                                textAlign: "center",
                                            }}
                                        >
                                            Continuar pagamento
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity activeOpacity={0.8} onPress={openModal}>
                                <LinearGradient
                                    colors={t.gradientAccent}
                                    style={{
                                        borderRadius: 16,
                                        paddingVertical: 15,
                                        paddingHorizontal: 18,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: btnColor,
                                            fontSize: 16,
                                            fontWeight: "900",
                                            textAlign: "center",
                                        }}
                                    >
                                        Assinar plano IA
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
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
                            Essas alterações continuam locais no frontend por enquanto.
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
                                    {isSubmitting ? "Salvando..." : "Salvar alterações"}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <PlanCheckoutModal
                visible={isModalVisible}
                plan={plan}
                documentNumber={documentNumber}
                isCreatingCheckout={isCreatingCheckout}
                isRefreshingStatus={isRefreshingStatus}
                errorMessage={errorMessage}
                onClose={closeModal}
                onDocumentNumberChange={setDocumentNumber}
                onGenerateCheckout={() => void generateCheckout()}
                onRefreshStatus={() => void refreshStatus()}
            />
        </LinearGradient>
    );
}
