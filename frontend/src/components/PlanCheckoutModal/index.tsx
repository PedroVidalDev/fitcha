import { Ionicons } from "@expo/vector-icons";
import {
    Linking,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    Image,
    ActivityIndicator,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { AppModal } from "../AppModal";
import { Input } from "../Input";
import { PlanCheckoutModalProps } from "./types";

function formatCurrency(amountCents: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(amountCents / 100);
}

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

export function PlanCheckoutModal(props: PlanCheckoutModalProps) {
    const {
        visible,
        plan,
        documentNumber,
        isCreatingCheckout,
        isRefreshingStatus,
        errorMessage,
        onClose,
        onDocumentNumberChange,
        onGenerateCheckout,
        onRefreshStatus,
    } = props;

    const { t } = useTheme();
    const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";
    const isPending = plan?.status === "pending";
    const isApproved = plan?.status === "approved";
    const amountLabel = plan ? formatCurrency(plan.transactionAmountCents) : null;
    const paymentExpiresAt = formatDate(plan?.paymentExpiresAt);
    const accessExpiresAt = formatDate(plan?.accessExpiresAt);

    return (
        <AppModal visible={visible} onClose={onClose} contentStyle={{ maxHeight: "88%" }}>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                }}
            >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Ionicons name="sparkles" size={20} color={t.accent} />
                    <Text style={{ color: t.textPrimary, fontSize: 20, fontWeight: "900" }}>
                        Assinar Fitcha AI
                    </Text>
                </View>

                <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                    <Ionicons name="close" size={22} color={t.textMuted} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <Text
                    style={{
                        color: t.textMuted,
                        fontSize: 14,
                        lineHeight: 22,
                        marginBottom: 16,
                    }}
                >
                    Ao pagar este Pix, os beneficios do plano ficam ativos por 1 mes. Durante esse
                    periodo o modo AI permanece liberado sem opcao de cancelamento manual.
                </Text>

                <View
                    style={{
                        backgroundColor: t.inputBg,
                        borderRadius: 16,
                        borderWidth: 0.5,
                        borderColor: t.border,
                        padding: 16,
                        marginBottom: 18,
                    }}
                >
                    <Text
                        style={{
                            color: t.textPrimary,
                            fontSize: 16,
                            fontWeight: "800",
                            marginBottom: 8,
                        }}
                    >
                        O que voce recebe
                    </Text>

                    {[
                        "Acesso ao assistente de treino com IA por 1 mes apos a aprovacao do pagamento.",
                        "Ativacao automatica quando o Mercado Pago confirmar o Pix.",
                        "Nova assinatura somente apos o periodo atual terminar.",
                    ].map((item) => (
                        <View
                            key={item}
                            style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}
                        >
                            <Ionicons name="checkmark-circle" size={18} color={t.accent} />
                            <Text
                                style={{
                                    flex: 1,
                                    color: t.textMuted,
                                    fontSize: 13,
                                    lineHeight: 19,
                                }}
                            >
                                {item}
                            </Text>
                        </View>
                    ))}
                </View>

                {!isPending && !isApproved && (
                    <>
                        <Input
                            label="CPF do pagador"
                            icon="card-outline"
                            value={documentNumber}
                            onChangeText={onDocumentNumberChange}
                            placeholder="00000000000"
                            keyboardType="numeric"
                            error={undefined}
                        />

                        <TouchableOpacity
                            activeOpacity={0.8}
                            disabled={isCreatingCheckout}
                            onPress={onGenerateCheckout}
                            style={{ opacity: isCreatingCheckout ? 0.8 : 1 }}
                        >
                            <View
                                style={{
                                    backgroundColor: t.accent,
                                    borderRadius: 16,
                                    paddingVertical: 16,
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ color: btnColor, fontSize: 16, fontWeight: "900" }}>
                                    {isCreatingCheckout ? "Gerando Pix..." : "Gerar Pix"}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </>
                )}

                {plan && (
                    <View
                        style={{
                            backgroundColor: t.inputBg,
                            borderRadius: 18,
                            borderWidth: 0.5,
                            borderColor: t.border,
                            padding: 18,
                            marginTop: isPending || isApproved ? 0 : 18,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 12,
                            }}
                        >
                            <Text style={{ color: t.textPrimary, fontSize: 17, fontWeight: "900" }}>
                                {amountLabel ?? "Plano Fitcha AI"}
                            </Text>
                            <View
                                style={{
                                    backgroundColor: isApproved
                                        ? t.accent
                                        : isPending
                                          ? t.surface
                                          : t.card,
                                    borderRadius: 999,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                }}
                            >
                                <Text
                                    style={{
                                        color: isApproved
                                            ? btnColor
                                            : isPending
                                              ? t.textPrimary
                                              : t.textMuted,
                                        fontSize: 11,
                                        fontWeight: "900",
                                        textTransform: "uppercase",
                                        letterSpacing: 1,
                                    }}
                                >
                                    {isApproved
                                        ? "Pago"
                                        : isPending
                                          ? "Aguardando Pix"
                                          : "Pendente"}
                                </Text>
                            </View>
                        </View>

                        {paymentExpiresAt && (
                            <Text
                                style={{
                                    color: t.textMuted,
                                    fontSize: 13,
                                    marginBottom: 10,
                                    lineHeight: 19,
                                }}
                            >
                                Pix valido ate {paymentExpiresAt}.
                            </Text>
                        )}

                        {isApproved && accessExpiresAt && (
                            <Text
                                style={{
                                    color: t.textMuted,
                                    fontSize: 13,
                                    marginBottom: 10,
                                    lineHeight: 19,
                                }}
                            >
                                Plano ativo ate {accessExpiresAt}.
                            </Text>
                        )}

                        {isPending && plan.qrCodeBase64 ? (
                            <View style={{ alignItems: "center", marginVertical: 10 }}>
                                <Image
                                    source={{ uri: `data:image/png;base64,${plan.qrCodeBase64}` }}
                                    style={{
                                        width: 220,
                                        height: 220,
                                        borderRadius: 16,
                                        backgroundColor: "#FFF",
                                    }}
                                />
                            </View>
                        ) : null}

                        {isPending && !!plan.qrCode && (
                            <View
                                style={{
                                    backgroundColor: t.card,
                                    borderRadius: 14,
                                    padding: 14,
                                    marginTop: 8,
                                }}
                            >
                                <Text
                                    style={{
                                        color: t.textPrimary,
                                        fontSize: 13,
                                        fontWeight: "800",
                                        marginBottom: 8,
                                    }}
                                >
                                    Pix copia e cola
                                </Text>
                                <Text
                                    selectable
                                    style={{ color: t.textMuted, fontSize: 12, lineHeight: 18 }}
                                >
                                    {plan.qrCode}
                                </Text>
                            </View>
                        )}

                        {isApproved ? (
                            <View
                                style={{
                                    marginTop: 16,
                                    backgroundColor: t.chipBg,
                                    borderRadius: 14,
                                    padding: 14,
                                }}
                            >
                                <Text
                                    style={{ color: t.textPrimary, fontSize: 14, lineHeight: 20 }}
                                >
                                    Pagamento confirmado. O botao de IA ja deve aparecer nas telas
                                    em que o recurso estiver disponivel.
                                </Text>
                            </View>
                        ) : (
                            <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={onRefreshStatus}
                                    style={{
                                        flex: 1,
                                        borderRadius: 14,
                                        borderWidth: 0.5,
                                        borderColor: t.border,
                                        backgroundColor: t.card,
                                        paddingVertical: 14,
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {isRefreshingStatus ? (
                                        <ActivityIndicator color={t.accent} />
                                    ) : (
                                        <Text
                                            style={{
                                                color: t.textPrimary,
                                                fontSize: 14,
                                                fontWeight: "800",
                                            }}
                                        >
                                            Verificar pagamento
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                {!!plan.ticketUrl && (
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => void Linking.openURL(plan.ticketUrl)}
                                        style={{
                                            flex: 1,
                                            borderRadius: 14,
                                            backgroundColor: t.accent,
                                            paddingVertical: 14,
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: btnColor,
                                                fontSize: 14,
                                                fontWeight: "900",
                                            }}
                                        >
                                            Abrir cobranca
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                )}

                {errorMessage && (
                    <Text
                        style={{
                            color: "#EF5350",
                            fontSize: 13,
                            fontWeight: "700",
                            marginTop: 16,
                            lineHeight: 19,
                        }}
                    >
                        {errorMessage}
                    </Text>
                )}
            </ScrollView>
        </AppModal>
    );
}
