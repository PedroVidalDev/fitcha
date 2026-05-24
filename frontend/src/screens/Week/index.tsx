import { useWeek } from "@/src/hooks/useWeek";
import { RootStackParamList } from "@/src/router/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useLayoutEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { AIWizard } from "../../components/AIWizard";
import { WizardData } from "../../components/AIWizard/types";
import { AnimatedCard } from "../../components/AnimatedCard";
import { CategoryBadge } from "../../components/CategoryBadge";
import { ConfirmModal } from "../../components/ConfirmModal";
import { CreditPurchaseModal } from "../../components/CreditPurchaseModal";
import { GradientCard } from "../../components/GradientCard";
import { getDayLabelKey } from "../../constants/categories";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../contexts/I18nContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useCreditCheckout } from "../../hooks/useCreditCheckout";
import { generateAIWorkout } from "../../services/aiWorkout";
import { syncWorkoutData } from "../../services/workoutData";

type Nav = NativeStackNavigationProp<RootStackParamList, "Week">;

export default function WeekScreen() {
    const { t } = useTheme();
    const { t: translate } = useI18n();
    const { user, setCredits } = useAuth();
    const navigation = useNavigation<Nav>();
    const { days, refresh } = useWeek();
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
    } = useCreditCheckout();

    const [wizardVisible, setWizardVisible] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);

    const today = new Date().getDay();
    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: user
                ? () => (
                      <TouchableOpacity
                          onPress={() => setWizardVisible(true)}
                          style={{ padding: 6 }}
                      >
                          <Ionicons name="sparkles" size={22} color={t.accent} />
                      </TouchableOpacity>
                  )
                : undefined,
        });
    }, [navigation, t.accent, user]);

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh]),
    );

    const handleGenerateWorkout = useCallback(
        async (wizardData: WizardData) => {
            const response = await generateAIWorkout(wizardData);
            await syncWorkoutData();
            await setCredits(response.remainingCredits);
            await refresh();
            setSuccessVisible(true);
        },
        [refresh, setCredits],
    );

    return (
        <View style={{ flex: 1, backgroundColor: t.bg, padding: 16 }}>
            <LinearGradient
                colors={t.gradientHero}
                style={{
                    borderRadius: 22,
                    padding: 18,
                    marginBottom: 18,
                    borderWidth: 1,
                    borderColor: t.border,
                    overflow: "hidden",
                }}
            >
                <View
                    style={{
                        position: "absolute",
                        right: -20,
                        top: -26,
                        width: 96,
                        height: 96,
                        borderRadius: 999,
                        backgroundColor: t.chipBg,
                    }}
                />
                <Text
                    style={{
                        color: t.textDim,
                        fontSize: 11,
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: 2,
                    }}
                >
                    {translate("week.title")}
                </Text>
                <Text
                    style={{
                        color: t.textPrimary,
                        fontSize: 24,
                        fontWeight: "900",
                        marginTop: 8,
                    }}
                >
                    {translate("week.title")}
                </Text>
                <Text
                    style={{
                        color: t.textMuted,
                        fontSize: 13,
                        lineHeight: 19,
                        marginTop: 8,
                    }}
                >
                    {translate("week.machineCount", {
                        count: Object.values(days).reduce((sum, items) => sum + items.length, 0),
                        pluralSuffix:
                            Object.values(days).reduce((sum, items) => sum + items.length, 0) !== 1
                                ? "s"
                                : "",
                    })}
                </Text>
            </LinearGradient>

            <FlatList
                data={[0, 1, 2, 3, 4, 5, 6]}
                keyExtractor={(item) => String(item)}
                contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: dayIndex, index }) => {
                    const machines = days[dayIndex] ?? [];
                    const isEmpty = machines.length === 0;
                    const isToday = dayIndex === today;

                    return (
                        <AnimatedCard index={index}>
                            <GradientCard
                                onPress={() => {
                                    navigation.navigate("Day", { dayIndex });
                                }}
                            >
                                <View style={{ flex: 1 }}>
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: t.textPrimary,
                                                fontSize: 16,
                                                fontWeight: "700",
                                            }}
                                        >
                                            {translate(getDayLabelKey(dayIndex))}
                                        </Text>
                                        {isToday ? (
                                            <View
                                                style={{
                                                    paddingHorizontal: 9,
                                                    paddingVertical: 4,
                                                    borderRadius: 999,
                                                    backgroundColor: t.chipBg,
                                                    borderWidth: 1,
                                                    borderColor: t.accent,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color: t.accent,
                                                        fontSize: 10,
                                                        fontWeight: "800",
                                                    }}
                                                >
                                                    {translate("week.todayBadge")}
                                                </Text>
                                            </View>
                                        ) : null}
                                    </View>

                                    {isEmpty ? (
                                        <Text
                                            style={{
                                                color: t.textDim,
                                                fontSize: 12,
                                                marginTop: 6,
                                                fontStyle: "italic",
                                            }}
                                        >
                                            {translate("week.emptyDay")}
                                        </Text>
                                    ) : (
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                flexWrap: "wrap",
                                                gap: 6,
                                                marginTop: 8,
                                            }}
                                        >
                                            {[
                                                ...new Set(
                                                    machines.map((machine) => machine.categoryKey),
                                                ),
                                            ].map((key) => (
                                                <CategoryBadge key={key} categoryKey={key} />
                                            ))}
                                            <Text
                                                style={{
                                                    color: t.textDim,
                                                    fontSize: 11,
                                                    alignSelf: "center",
                                                    marginLeft: 2,
                                                }}
                                            >
                                                {translate("week.machineCount", {
                                                    count: machines.length,
                                                    pluralSuffix: machines.length !== 1 ? "s" : "",
                                                })}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
                            </GradientCard>
                        </AnimatedCard>
                    );
                }}
            />

            <AIWizard
                visible={wizardVisible}
                onClose={() => setWizardVisible(false)}
                onRequestBuyCredits={openModal}
                onFinish={handleGenerateWorkout}
            />

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

            <ConfirmModal
                visible={successVisible}
                onClose={() => setSuccessVisible(false)}
                onConfirm={() => setSuccessVisible(false)}
                title={translate("week.generated.title")}
                message={translate("week.generated.message")}
                confirmLabel={translate("common.actions.close")}
                hideCancel
                confirmVariant="accent"
            />
        </View>
    );
}
