import { Ionicons } from "@expo/vector-icons";
import {
    ActivityIndicator,
    Image,
    Linking,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useI18n } from "../../contexts/I18nContext";
import { useTheme } from "../../contexts/ThemeContext";
import { AppModal } from "../AppModal";
import { Input } from "../Input";
import { PlanCheckoutModalProps } from "./types";

function formatCurrency(amountCents: number, locale: string) {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "BRL",
    }).format(amountCents / 100);
}

function formatDate(value: string | null | undefined, locale: string) {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return new Intl.DateTimeFormat(locale, {
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
    const { t: translate, locale } = useI18n();
    const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";
    const isPending = plan?.status === "pending";
    const isApproved = plan?.status === "approved";
    const amountLabel = plan
        ? formatCurrency(plan.transactionAmountCents, locale)
        : translate("planCheckout.planFallback");
    const paymentExpiresAt = formatDate(plan?.paymentExpiresAt, locale);
    const accessExpiresAt = formatDate(plan?.accessExpiresAt, locale);

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
                <View
                    style={{
                        flex: 1,
                        minWidth: 0,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                    }}
                >
                    <Ionicons name="sparkles" size={20} color={t.accent} />
                    <Text
                        style={{ color: t.textPrimary, fontSize: 20, fontWeight: "900", flexShrink: 1 }}
                    >
                        {translate("planCheckout.title")}
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
                    {translate("planCheckout.description")}
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
                        {translate("planCheckout.whatYouGet")}
                    </Text>

                    {[
                        translate("planCheckout.benefit.aiAccess"),
                        translate("planCheckout.benefit.autoActivation"),
                        translate("planCheckout.benefit.renewal"),
                    ].map((item) => (
                        <View key={item} style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
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
                            label={translate("planCheckout.documentLabel")}
                            icon="card-outline"
                            value={documentNumber}
                            onChangeText={onDocumentNumberChange}
                            placeholder={translate("planCheckout.documentPlaceholder")}
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
                                <Text
                                    style={{
                                        color: btnColor,
                                        fontSize: 16,
                                        fontWeight: "900",
                                        textAlign: "center",
                                    }}
                                >
                                    {isCreatingCheckout
                                        ? translate("planCheckout.generatingPix")
                                        : translate("planCheckout.generatePix")}
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
                            <Text
                                style={{
                                    color: t.textPrimary,
                                    fontSize: 17,
                                    fontWeight: "900",
                                    flex: 1,
                                    minWidth: 0,
                                    marginRight: 10,
                                }}
                            >
                                {amountLabel}
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
                                    flexShrink: 0,
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
                                        ? translate("planCheckout.status.paid")
                                        : isPending
                                          ? translate("planCheckout.status.awaitingPix")
                                          : translate("planCheckout.status.pending")}
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
                                {translate("planCheckout.pixValidUntil", { date: paymentExpiresAt })}
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
                                {translate("planCheckout.planActiveUntil", { date: accessExpiresAt })}
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
                                    {translate("planCheckout.copyPastePix")}
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
                                <Text style={{ color: t.textPrimary, fontSize: 14, lineHeight: 20 }}>
                                    {translate("planCheckout.approvedMessage")}
                                </Text>
                            </View>
                        ) : (
                            <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={onRefreshStatus}
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        borderRadius: 14,
                                        borderWidth: 0.5,
                                        borderColor: t.border,
                                        backgroundColor: t.card,
                                        paddingVertical: 14,
                                        paddingHorizontal: 10,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        overflow: "hidden",
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
                                                textAlign: "center",
                                            }}
                                        >
                                            {translate("planCheckout.checkPayment")}
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                {!!plan.ticketUrl && (
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => void Linking.openURL(plan.ticketUrl)}
                                        style={{
                                            flex: 1,
                                            minWidth: 0,
                                            borderRadius: 14,
                                            backgroundColor: t.accent,
                                            paddingVertical: 14,
                                            paddingHorizontal: 10,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: btnColor,
                                                fontSize: 14,
                                                fontWeight: "900",
                                                textAlign: "center",
                                            }}
                                        >
                                            {translate("planCheckout.openCharge")}
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
