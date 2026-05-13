import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import { CreditPurchaseModalProps } from "./types";

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

export function CreditPurchaseModal(props: CreditPurchaseModalProps) {
    const {
        visible,
        step,
        payment,
        creditQuantity,
        documentNumber,
        isLoading,
        isCreatingCheckout,
        isRefreshingStatus,
        errorMessage,
        onClose,
        onCreditQuantityChange,
        onDocumentNumberChange,
        onContinue,
        onBack,
        onGenerateCheckout,
        onRefreshStatus,
    } = props;

    const { t } = useTheme();
    const { t: translate, locale } = useI18n();
    const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";
    const effectiveStep =
        payment?.status === "pending" || payment?.status === "approved" ? 3 : step;
    const livePayment = payment?.status === "pending" || payment?.status === "approved";

    const parsedQuantity = Number.parseInt(creditQuantity, 10);
    const quantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;
    const unitAmountCents = payment?.unitAmountCents ?? 400;
    const totalAmountCents = payment?.transactionAmountCents ?? quantity * unitAmountCents;
    const amountLabel = payment
        ? formatCurrency(payment.transactionAmountCents, locale)
        : formatCurrency(totalAmountCents, locale);
    const paymentExpiresAt = formatDate(payment?.paymentExpiresAt, locale);

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
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    <Ionicons name="sparkles" size={20} color={t.accent} />
                    <Text
                        style={{
                            color: t.textPrimary,
                            fontSize: 20,
                            fontWeight: "900",
                            flexShrink: 1,
                        }}
                    >
                        {translate("creditCheckout.title")}
                    </Text>
                </View>

                <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                    <Ionicons name="close" size={22} color={t.textMuted} />
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", gap: 6, marginBottom: 16 }}>
                {[1, 2, 3].map((item) => (
                    <View
                        key={item}
                        style={{
                            flex: 1,
                            height: 3,
                            borderRadius: 999,
                            backgroundColor: item <= effectiveStep ? t.accent : t.inputBg,
                        }}
                    />
                ))}
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 18 }}>
                <Text style={{ color: t.textDim, fontSize: 11, fontWeight: "800" }}>
                    {translate("creditCheckout.step.quantity")}
                </Text>
                <Text style={{ color: t.textDim, fontSize: 11, fontWeight: "800" }}>
                    {translate("creditCheckout.step.document")}
                </Text>
                <Text style={{ color: t.textDim, fontSize: 11, fontWeight: "800" }}>
                    {translate("creditCheckout.step.payment")}
                </Text>
            </View>

            {isLoading && !livePayment ? (
                <View style={{ paddingVertical: 40, alignItems: "center" }}>
                    <ActivityIndicator color={t.accent} />
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 14,
                            lineHeight: 22,
                            marginBottom: 16,
                        }}
                    >
                        {translate("creditCheckout.description")}
                    </Text>

                    {effectiveStep === 1 ? (
                        <>
                            <Text
                                style={{
                                    color: t.textPrimary,
                                    fontSize: 18,
                                    fontWeight: "900",
                                    marginBottom: 8,
                                }}
                            >
                                {translate("creditCheckout.quantityTitle")}
                            </Text>
                            <Text
                                style={{
                                    color: t.textMuted,
                                    fontSize: 13,
                                    lineHeight: 20,
                                    marginBottom: 18,
                                }}
                            >
                                {translate("creditCheckout.quantityDescription")}
                            </Text>

                            <Input
                                label={translate("creditCheckout.quantityLabel")}
                                icon="flash-outline"
                                value={creditQuantity}
                                onChangeText={onCreditQuantityChange}
                                placeholder={translate("creditCheckout.quantityPlaceholder")}
                                keyboardType="numeric"
                                error={undefined}
                            />

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
                                <Text style={{ color: t.textPrimary, fontSize: 14, lineHeight: 21 }}>
                                    {translate("creditCheckout.quantityHint", {
                                        price: formatCurrency(unitAmountCents, locale),
                                        total: amountLabel,
                                    })}
                                </Text>
                            </View>

                            <TouchableOpacity activeOpacity={0.8} onPress={onContinue}>
                                <LinearGradient
                                    colors={t.gradientAccent}
                                    style={{
                                        borderRadius: 16,
                                        paddingVertical: 16,
                                        alignItems: "center",
                                    }}
                                >
                                    <Text style={{ color: btnColor, fontSize: 16, fontWeight: "900" }}>
                                        {translate("common.actions.continue")}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    ) : null}

                    {effectiveStep === 2 ? (
                        <>
                            <Text
                                style={{
                                    color: t.textPrimary,
                                    fontSize: 18,
                                    fontWeight: "900",
                                    marginBottom: 8,
                                }}
                            >
                                {translate("creditCheckout.documentTitle")}
                            </Text>
                            <Text
                                style={{
                                    color: t.textMuted,
                                    fontSize: 13,
                                    lineHeight: 20,
                                    marginBottom: 18,
                                }}
                            >
                                {translate("creditCheckout.documentDescription")}
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
                                        fontSize: 15,
                                        fontWeight: "800",
                                        marginBottom: 4,
                                    }}
                                >
                                    {translate("creditCheckout.summaryCredits", { count: quantity })}
                                </Text>
                                <Text style={{ color: t.textMuted, fontSize: 13 }}>{amountLabel}</Text>
                            </View>

                            <Input
                                label={translate("creditCheckout.documentLabel")}
                                icon="card-outline"
                                value={documentNumber}
                                onChangeText={onDocumentNumberChange}
                                placeholder={translate("creditCheckout.documentPlaceholder")}
                                keyboardType="numeric"
                                error={undefined}
                            />

                            <View style={{ flexDirection: "row", gap: 12 }}>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={onBack}
                                    style={{
                                        flex: 1,
                                        borderRadius: 16,
                                        borderWidth: 0.5,
                                        borderColor: t.border,
                                        paddingVertical: 15,
                                        alignItems: "center",
                                        backgroundColor: t.card,
                                    }}
                                >
                                    <Text style={{ color: t.textPrimary, fontSize: 15, fontWeight: "800" }}>
                                        {translate("common.actions.back")}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    disabled={isCreatingCheckout}
                                    onPress={onGenerateCheckout}
                                    style={{ flex: 1, opacity: isCreatingCheckout ? 0.8 : 1 }}
                                >
                                    <LinearGradient
                                        colors={t.gradientAccent}
                                        style={{
                                            borderRadius: 16,
                                            paddingVertical: 15,
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text
                                            style={{ color: btnColor, fontSize: 15, fontWeight: "900" }}
                                        >
                                            {isCreatingCheckout
                                                ? translate("creditCheckout.generatingPix")
                                                : translate("creditCheckout.generatePix")}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : null}

                    {effectiveStep === 3 && payment ? (
                        <View
                            style={{
                                backgroundColor: t.inputBg,
                                borderRadius: 18,
                                borderWidth: 0.5,
                                borderColor: t.border,
                                padding: 18,
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
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text
                                        style={{
                                            color: t.textPrimary,
                                            fontSize: 17,
                                            fontWeight: "900",
                                            marginBottom: 4,
                                        }}
                                    >
                                        {amountLabel}
                                    </Text>
                                    <Text style={{ color: t.textMuted, fontSize: 13 }}>
                                        {translate("creditCheckout.summaryCredits", {
                                            count: payment.creditQuantity,
                                        })}
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        backgroundColor:
                                            payment.status === "approved" ? t.accent : t.surface,
                                        borderRadius: 999,
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        marginLeft: 12,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color:
                                                payment.status === "approved"
                                                    ? btnColor
                                                    : t.textPrimary,
                                            fontSize: 11,
                                            fontWeight: "900",
                                            textTransform: "uppercase",
                                            letterSpacing: 1,
                                        }}
                                    >
                                        {payment.status === "approved"
                                            ? translate("creditCheckout.status.paid")
                                            : translate("creditCheckout.status.awaitingPix")}
                                    </Text>
                                </View>
                            </View>

                            {paymentExpiresAt ? (
                                <Text
                                    style={{
                                        color: t.textMuted,
                                        fontSize: 13,
                                        lineHeight: 19,
                                        marginBottom: 12,
                                    }}
                                >
                                    {translate("creditCheckout.pixValidUntil", { date: paymentExpiresAt })}
                                </Text>
                            ) : null}

                            {payment.status === "pending" && payment.qrCodeBase64 ? (
                                <View style={{ alignItems: "center", marginVertical: 10 }}>
                                    <Image
                                        source={{ uri: `data:image/png;base64,${payment.qrCodeBase64}` }}
                                        style={{
                                            width: 220,
                                            height: 220,
                                            borderRadius: 16,
                                            backgroundColor: "#FFF",
                                        }}
                                    />
                                </View>
                            ) : null}

                            {payment.status === "pending" && payment.qrCode ? (
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
                                        {translate("creditCheckout.copyPastePix")}
                                    </Text>
                                    <Text
                                        selectable
                                        style={{ color: t.textMuted, fontSize: 12, lineHeight: 18 }}
                                    >
                                        {payment.qrCode}
                                    </Text>
                                </View>
                            ) : null}

                            {payment.status === "approved" ? (
                                <View
                                    style={{
                                        marginTop: 16,
                                        backgroundColor: t.chipBg,
                                        borderRadius: 14,
                                        padding: 14,
                                    }}
                                >
                                    <Text style={{ color: t.textPrimary, fontSize: 14, lineHeight: 20 }}>
                                        {translate("creditCheckout.approvedMessage")}
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
                                                    textAlign: "center",
                                                }}
                                            >
                                                {translate("creditCheckout.checkPayment")}
                                            </Text>
                                        )}
                                    </TouchableOpacity>

                                    {payment.ticketUrl ? (
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => void Linking.openURL(payment.ticketUrl)}
                                            style={{ flex: 1 }}
                                        >
                                            <LinearGradient
                                                colors={t.gradientAccent}
                                                style={{
                                                    borderRadius: 14,
                                                    paddingVertical: 14,
                                                    alignItems: "center",
                                                    justifyContent: "center",
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
                                                    {translate("creditCheckout.openCharge")}
                                                </Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            )}
                        </View>
                    ) : null}

                    {errorMessage ? (
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
                    ) : null}
                </ScrollView>
            )}
        </AppModal>
    );
}
