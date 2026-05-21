import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback } from "react";
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
import { CreditPurchaseModal } from "../../components/CreditPurchaseModal";
import { Input } from "../../components/Input";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../contexts/I18nContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useCreditCheckout } from "../../hooks/useCreditCheckout";
import { localeLabels, supportedLocales } from "../../translates";
import { useProfileForm } from "./hooks/useProfileForm";

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

export default function ProfileScreen() {
    const { t: theme } = useTheme();
    const { user, updateProfile } = useAuth();
    const { locale, setLocale, t } = useI18n();

    const { values, errors, isSubmitting, setField, handleSubmit } = useProfileForm({
        user,
        onSubmitProfile: updateProfile,
    });

    const {
        payment,
        creditQuantity,
        documentNumber,
        step,
        isModalVisible,
        isLoading,
        isCreatingCheckout,
        isRefreshingStatus,
        errorMessage,
        setCreditQuantity,
        setDocumentNumber,
        openModal,
        closeModal,
        goToDocumentStep,
        goBackStep,
        generateCheckout,
        refreshStatus,
        reloadSummary,
    } = useCreditCheckout({
        autoLoad: true,
    });

    useFocusEffect(
        useCallback(() => {
            void reloadSummary();
        }, [reloadSummary]),
    );

    if (!user) return null;

    const btnColor = theme.mode === "dark" ? "#0d0500" : "#FFF";
    const paymentExpiresAt = formatDate(payment?.paymentExpiresAt, locale);
    const hasPendingPayment = payment?.status === "pending";

    const handleSaveProfile = async () => {
        const saved = await handleSubmit();
        if (!saved) return;

        Alert.alert(t("profile.alert.savedTitle"), t("profile.alert.savedMessage"));
    };

    return (
        <LinearGradient colors={theme.gradientHero} style={{ flex: 1 }}>
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
                            backgroundColor: theme.inputBg,
                            borderRadius: 24,
                            padding: 20,
                            borderWidth: 0.5,
                            borderColor: theme.border,
                            marginBottom: 18,
                        }}
                    >
                        <View
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 999,
                                backgroundColor: theme.accent,
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
                                color: theme.textDim,
                                fontSize: 11,
                                fontWeight: "700",
                                textTransform: "uppercase",
                                letterSpacing: 2,
                                marginBottom: 8,
                            }}
                        >
                            {t("profile.kicker")}
                        </Text>

                        <Text
                            style={{
                                color: theme.textPrimary,
                                fontSize: 28,
                                fontWeight: "900",
                                marginBottom: 8,
                            }}
                        >
                            {user.name}
                        </Text>

                        <Text style={{ color: theme.textMuted, fontSize: 14, lineHeight: 21 }}>
                            {t("profile.header.description")}
                        </Text>
                    </View>

                    <View
                        style={{
                            backgroundColor: theme.inputBg,
                            borderRadius: 24,
                            padding: 20,
                            borderWidth: 0.5,
                            borderColor: theme.border,
                            marginBottom: 18,
                        }}
                    >
                        <Text
                            style={{
                                color: theme.textPrimary,
                                fontSize: 20,
                                fontWeight: "900",
                                marginBottom: 6,
                            }}
                        >
                            {t("profile.language.title")}
                        </Text>
                        <Text
                            style={{
                                color: theme.textMuted,
                                fontSize: 13,
                                lineHeight: 20,
                                marginBottom: 18,
                            }}
                        >
                            {t("profile.language.description")}
                        </Text>

                        <View style={{ gap: 10 }}>
                            {supportedLocales.map((option) => {
                                const isActive = option === locale;

                                return (
                                    <TouchableOpacity
                                        key={option}
                                        activeOpacity={0.8}
                                        onPress={() => setLocale(option)}
                                    >
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                backgroundColor: isActive ? theme.chipBg : theme.card,
                                                borderRadius: 16,
                                                paddingHorizontal: 16,
                                                paddingVertical: 14,
                                                borderWidth: 0.5,
                                                borderColor: isActive ? theme.accent : theme.border,
                                            }}
                                        >
                                            <View>
                                                <Text
                                                    style={{
                                                        color: isActive ? theme.textPrimary : theme.textMuted,
                                                        fontSize: 15,
                                                        fontWeight: "800",
                                                    }}
                                                >
                                                    {localeLabels[option]}
                                                </Text>
                                                <Text
                                                    style={{
                                                        color: theme.textDim,
                                                        fontSize: 11,
                                                        marginTop: 2,
                                                    }}
                                                >
                                                    {option}
                                                </Text>
                                            </View>

                                            <Ionicons
                                                name={isActive ? "checkmark-circle" : "ellipse-outline"}
                                                size={20}
                                                color={isActive ? theme.accent : theme.textDim}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View
                        style={{
                            backgroundColor: theme.inputBg,
                            borderRadius: 24,
                            padding: 20,
                            borderWidth: 0.5,
                            borderColor: theme.border,
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
                                        backgroundColor: theme.chipBg,
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                >
                                    <Ionicons name="sparkles" size={20} color={theme.accent} />
                                </View>
                                <View style={{ flexShrink: 1 }}>
                                    <Text
                                        style={{
                                            color: theme.textPrimary,
                                            fontSize: 18,
                                            fontWeight: "800",
                                        }}
                                    >
                                        Fitcha AI
                                    </Text>
                                    <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                                        {t("profile.credits.subtitle")}
                                    </Text>
                                </View>
                            </View>

                            <View
                                style={{
                                    backgroundColor: theme.accent,
                                    borderRadius: 999,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    marginLeft: 12,
                                    flexShrink: 0,
                                }}
                            >
                                <Text
                                    style={{
                                        color: btnColor,
                                        fontSize: 11,
                                        fontWeight: "800",
                                        textTransform: "uppercase",
                                        letterSpacing: 1,
                                    }}
                                >
                                    {t("profile.credits.balanceLabel")}
                                </Text>
                            </View>
                        </View>

                        <Text
                            style={{
                                color: theme.textMuted,
                                fontSize: 14,
                                lineHeight: 21,
                                marginBottom: 14,
                            }}
                        >
                            {t("profile.credits.description")}
                        </Text>

                        <View
                            style={{
                                backgroundColor: theme.chipBg,
                                borderRadius: 20,
                                padding: 18,
                                marginBottom: 18,
                            }}
                        >
                            <Text
                                style={{
                                    color: theme.textDim,
                                    fontSize: 12,
                                    fontWeight: "800",
                                    textTransform: "uppercase",
                                    letterSpacing: 1.2,
                                    marginBottom: 8,
                                }}
                            >
                                {t("profile.credits.balanceLabel")}
                            </Text>
                            <Text
                                style={{
                                    color: theme.textPrimary,
                                    fontSize: 42,
                                    fontWeight: "900",
                                }}
                            >
                                {user.credits}
                            </Text>
                            <Text
                                style={{
                                    color: theme.textMuted,
                                    fontSize: 13,
                                    lineHeight: 20,
                                    marginTop: 6,
                                }}
                            >
                                {t("profile.credits.balanceHint")}
                            </Text>
                        </View>

                        {isLoading ? (
                            <View style={{ paddingVertical: 18, alignItems: "center" }}>
                                <ActivityIndicator color={theme.accent} />
                            </View>
                        ) : hasPendingPayment ? (
                            <View style={{ gap: 12 }}>
                                <View
                                    style={{
                                        backgroundColor: theme.chipBg,
                                        borderRadius: 16,
                                        padding: 16,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: theme.textPrimary,
                                            fontSize: 16,
                                            fontWeight: "900",
                                            marginBottom: 6,
                                        }}
                                    >
                                        {t("profile.credits.pendingTitle")}
                                    </Text>
                                    <Text
                                        style={{
                                            color: theme.textMuted,
                                            fontSize: 14,
                                            lineHeight: 21,
                                        }}
                                    >
                                        {paymentExpiresAt
                                            ? t("profile.credits.pendingDescriptionWithDate", {
                                                  date: paymentExpiresAt,
                                                  quantity: payment?.creditQuantity ?? 1,
                                              })
                                            : t("profile.credits.pendingDescription")}
                                    </Text>
                                </View>

                                <TouchableOpacity activeOpacity={0.8} onPress={openModal}>
                                    <LinearGradient
                                        colors={theme.gradientAccent}
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
                                            {t("profile.credits.continuePayment")}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity activeOpacity={0.8} onPress={openModal}>
                                <LinearGradient
                                    colors={theme.gradientAccent}
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
                                        {t("profile.credits.buy")}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View
                        style={{
                            backgroundColor: theme.inputBg,
                            borderRadius: 24,
                            padding: 20,
                            borderWidth: 0.5,
                            borderColor: theme.border,
                        }}
                    >
                        <Text
                            style={{
                                color: theme.textPrimary,
                                fontSize: 20,
                                fontWeight: "900",
                                marginBottom: 6,
                            }}
                        >
                            {t("profile.form.title")}
                        </Text>
                        <Text
                            style={{
                                color: theme.textMuted,
                                fontSize: 13,
                                lineHeight: 20,
                                marginBottom: 20,
                            }}
                        >
                            {t("profile.form.description")}
                        </Text>

                        <Input
                            label={t("auth.register.nameLabel")}
                            icon="person-outline"
                            value={values.name}
                            onChangeText={(value) => setField("name", value)}
                            placeholder={t("auth.register.namePlaceholder")}
                            autoCapitalize="words"
                            error={errors.name}
                        />

                        <Input
                            label={t("auth.register.emailLabel")}
                            icon="mail-outline"
                            value={values.email}
                            onChangeText={(value) => setField("email", value)}
                            placeholder={t("auth.register.emailPlaceholder")}
                            keyboardType="email-address"
                            error={errors.email}
                        />

                        <Input
                            label={t("profile.form.newPasswordLabel")}
                            icon="lock-closed-outline"
                            value={values.password}
                            onChangeText={(value) => setField("password", value)}
                            placeholder={t("profile.form.newPasswordPlaceholder")}
                            secure
                            error={errors.password}
                        />

                        <Input
                            label={t("profile.form.confirmNewPasswordLabel")}
                            icon="shield-checkmark-outline"
                            value={values.confirmPassword}
                            onChangeText={(value) => setField("confirmPassword", value)}
                            placeholder={t("profile.form.confirmNewPasswordPlaceholder")}
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
                                colors={theme.gradientAccent}
                                style={{
                                    borderRadius: 16,
                                    paddingVertical: 16,
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ color: btnColor, fontSize: 16, fontWeight: "900" }}>
                                    {isSubmitting ? t("profile.form.saving") : t("profile.form.save")}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <CreditPurchaseModal
                visible={isModalVisible}
                step={step}
                payment={payment}
                creditQuantity={creditQuantity}
                documentNumber={documentNumber}
                isLoading={isLoading}
                isCreatingCheckout={isCreatingCheckout}
                isRefreshingStatus={isRefreshingStatus}
                errorMessage={errorMessage}
                onClose={closeModal}
                onCreditQuantityChange={setCreditQuantity}
                onDocumentNumberChange={setDocumentNumber}
                onContinue={goToDocumentStep}
                onBack={goBackStep}
                onGenerateCheckout={() => void generateCheckout()}
                onRefreshStatus={() => void refreshStatus()}
            />
        </LinearGradient>
    );
}
