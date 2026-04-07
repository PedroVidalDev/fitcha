import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { AppModal } from "../AppModal";
import { useTheme } from "../../contexts/ThemeContext";
import { StepBody } from "./components/StepBody";
import { StepDays } from "./components/StepDays";
import { StepGoal } from "./components/StepGoal";
import { StepIntensity } from "./components/StepIntensity";
import { StepInstructions } from "./components/StepInstructions";
import { StepPreferences } from "./components/StepPreferences";
import { StepResult } from "./components/StepResult";
import { AIWizardProps, WizardData, WizardStep } from "./types";

function createInitialWizardData(): WizardData {
    return {
        height: "",
        weight: "",
        selectedDays: [],
        hoursPerDay: "",
        machinesPerDay: "",
        workoutSplit: "",
        intensity: null,
        goal: null,
        customInstructions: "",
    };
}

export function AIWizard(props: AIWizardProps) {
    const { visible, onClose, onFinish } = props;

    const { t } = useTheme();
    const [step, setStep] = useState<WizardStep>(0);
    const [data, setData] = useState<WizardData>(createInitialWizardData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const slideAnim = useRef(new Animated.Value(0)).current;
    const stepTitles = [
        "Seus dados fisicos",
        "Quais dias voce vai treinar?",
        "Preferencias do treino",
        "Qual a intensidade?",
        "Qual seu objetivo?",
        "Instrucoes personalizadas",
        "Confirmar geracao",
    ];
    const lastStep = (stepTitles.length - 1) as WizardStep;

    const animateStep = (nextStep: WizardStep) => {
        Animated.sequence([
            Animated.timing(slideAnim, { toValue: -30, duration: 120, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 30, duration: 0, useNativeDriver: true }),
        ]).start(() => {
            setStep(nextStep);
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 80,
                friction: 10,
                useNativeDriver: true,
            }).start();
        });
    };

    const goNext = () => {
        if (step < lastStep) animateStep((step + 1) as WizardStep);
    };

    const goBack = () => {
        if (step > 0) animateStep((step - 1) as WizardStep);
    };

    const resetWizard = () => {
        setStep(0);
        setData(createInitialWizardData());
    };

    const handleClose = () => {
        if (isSubmitting) return;
        resetWizard();
        onClose();
    };

    const canProceed =
        (step === 0 && data.height.trim() !== "" && data.weight.trim() !== "") ||
        (step === 1 && data.selectedDays.length > 0) ||
        step === 2 ||
        (step === 3 && data.intensity !== null) ||
        (step === 4 && data.goal !== null) ||
        step === 5 ||
        step === 6;

    const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";

    useEffect(() => {
        if (visible) {
            setStep(0);
            setData(createInitialWizardData());
            setIsSubmitting(false);
        }
    }, [visible]);

    return (
        <AppModal visible={visible} onClose={handleClose} contentStyle={{ maxHeight: "85%" }}>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                }}
            >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Ionicons name="sparkles" size={22} color={t.accent} />
                    <Text
                        style={{
                            color: t.accent,
                            fontSize: 13,
                            fontWeight: "800",
                            textTransform: "uppercase",
                            letterSpacing: 1,
                        }}
                    >
                        treino com ia
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={handleClose}
                    style={{ padding: 4, opacity: isSubmitting ? 0.5 : 1 }}
                    disabled={isSubmitting}
                >
                    <Ionicons name="close" size={22} color={t.textMuted} />
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", gap: 6, marginBottom: 20 }}>
                {stepTitles.map((_, i) => (
                    <View
                        key={i}
                        style={{
                            flex: 1,
                            height: 3,
                            borderRadius: 2,
                            backgroundColor: i <= step ? t.accent : t.inputBg,
                        }}
                    />
                ))}
            </View>

            <Text
                style={{
                    color: t.textPrimary,
                    fontSize: 20,
                    fontWeight: "800",
                    marginBottom: 20,
                }}
            >
                {stepTitles[step]}
            </Text>

            <ScrollView
                style={{ maxHeight: 320 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
                    {step === 0 && (
                        <StepBody
                            height={data.height}
                            weight={data.weight}
                            onHeightChange={(v) => setData({ ...data, height: v })}
                            onWeightChange={(v) => setData({ ...data, weight: v })}
                        />
                    )}
                    {step === 1 && (
                        <StepDays
                            value={data.selectedDays}
                            onChange={(value) => setData({ ...data, selectedDays: value })}
                        />
                    )}
                    {step === 2 && (
                        <StepPreferences
                            hoursPerDay={data.hoursPerDay}
                            machinesPerDay={data.machinesPerDay}
                            workoutSplit={data.workoutSplit}
                            onHoursPerDayChange={(v) => setData({ ...data, hoursPerDay: v })}
                            onMachinesPerDayChange={(v) => setData({ ...data, machinesPerDay: v })}
                            onWorkoutSplitChange={(v) => setData({ ...data, workoutSplit: v })}
                        />
                    )}
                    {step === 3 && (
                        <StepIntensity
                            value={data.intensity}
                            onChange={(v) => setData({ ...data, intensity: v })}
                        />
                    )}
                    {step === 4 && (
                        <StepGoal
                            value={data.goal}
                            onChange={(v) => setData({ ...data, goal: v })}
                        />
                    )}
                    {step === 5 && (
                        <StepInstructions
                            value={data.customInstructions}
                            onChange={(v) => setData({ ...data, customInstructions: v })}
                        />
                    )}
                    {step === 6 && <StepResult data={data} />}
                </Animated.View>
            </ScrollView>

            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 24,
                }}
            >
                {step > 0 ? (
                    <TouchableOpacity onPress={goBack} style={{ padding: 12 }}>
                        <Text
                            style={{
                                color: t.textMuted,
                                fontSize: 15,
                                fontWeight: "600",
                            }}
                        >
                            Voltar
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <View />
                )}

                {step < lastStep ? (
                    <TouchableOpacity
                        onPress={goNext}
                        activeOpacity={0.75}
                        disabled={!canProceed || isSubmitting}
                        style={{ opacity: canProceed && !isSubmitting ? 1 : 0.4 }}
                    >
                        <LinearGradient
                            colors={t.gradientAccent}
                            style={{
                                paddingHorizontal: 28,
                                paddingVertical: 12,
                                borderRadius: 12,
                            }}
                        >
                            <Text
                                style={{
                                    color: btnColor,
                                    fontSize: 15,
                                    fontWeight: "800",
                                }}
                            >
                                Proximo
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={async () => {
                            try {
                                setIsSubmitting(true);
                                await onFinish(data);
                                resetWizard();
                                onClose();
                            } catch (error) {
                                Alert.alert(
                                    "Erro ao gerar treino",
                                    error instanceof Error
                                        ? error.message
                                        : "Nao foi possivel gerar o treino agora.",
                                );
                            } finally {
                                setIsSubmitting(false);
                            }
                        }}
                        activeOpacity={0.75}
                        disabled={isSubmitting}
                        style={{ opacity: isSubmitting ? 0.7 : 1 }}
                    >
                        <LinearGradient
                            colors={t.gradientAccent}
                            style={{
                                paddingHorizontal: 28,
                                paddingVertical: 12,
                                borderRadius: 12,
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <Ionicons name="sparkles" size={16} color={btnColor} />
                            <Text
                                style={{
                                    color: btnColor,
                                    fontSize: 15,
                                    fontWeight: "800",
                                }}
                            >
                                {isSubmitting ? "Gerando..." : "Gerar treino"}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>
        </AppModal>
    );
}
