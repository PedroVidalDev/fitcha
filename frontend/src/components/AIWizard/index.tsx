import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { StepBody } from "./components/StepBody";
import { StepDays } from "./components/StepDays";
import { StepGoal } from "./components/StepGoal";
import { StepIntensity } from "./components/StepIntensity";
import { StepResult } from "./components/StepResult";
import { AIWizardProps, WizardData, WizardStep } from "./types";

export function AIWizard(props: AIWizardProps) {
    const { visible, onClose, onFinish } = props;

    const { t } = useTheme();
    const [step, setStep] = useState<WizardStep>(0);
    const [data, setData] = useState<WizardData>({
        height: "",
        weight: "",
        daysPerWeek: null,
        intensity: null,
        goal: null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const scale = useRef(new Animated.Value(0.9)).current;
    const fade = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

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
        if (step < 4) animateStep((step + 1) as WizardStep);
    };

    const goBack = () => {
        if (step > 0) animateStep((step - 1) as WizardStep);
    };

    const resetWizard = () => {
        setStep(0);
        setData({ height: "", weight: "", daysPerWeek: null, intensity: null, goal: null });
    };

    const handleClose = () => {
        if (isSubmitting) return;
        resetWizard();
        onClose();
    };

    const canProceed =
        (step === 0 && data.height.trim() !== "" && data.weight.trim() !== "") ||
        (step === 1 && data.daysPerWeek !== null) ||
        (step === 2 && data.intensity !== null) ||
        (step === 3 && data.goal !== null) ||
        step === 4;

    const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";

    const stepTitles = [
        "Seus dados físicos",
        "Quantos dias por semana?",
        "Qual a intensidade?",
        "Qual seu objetivo?",
        "Prompt gerado",
    ];

    useEffect(() => {
        if (visible) {
            setStep(0);
            setData({ height: "", weight: "", daysPerWeek: null, intensity: null, goal: null });
            setIsSubmitting(false);
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1,
                    tension: 65,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
        } else {
            scale.setValue(0.9);
            fade.setValue(0);
        }
    }, [visible]);

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <Animated.View
                style={{
                    flex: 1,
                    backgroundColor: t.overlay,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 20,
                    opacity: fade,
                }}
            >
                <Animated.View style={{ transform: [{ scale }], width: "100%" }}>
                    <LinearGradient
                        colors={t.gradientModal}
                        style={{
                            width: "100%",
                            borderRadius: 24,
                            padding: 24,
                            borderWidth: 0.5,
                            borderColor: t.border,
                            maxHeight: "85%",
                            ...Platform.select({
                                ios: {
                                    shadowColor: t.shadow,
                                    shadowOffset: { width: 0, height: 8 },
                                    shadowOpacity: 0.15,
                                    shadowRadius: 24,
                                },
                                android: { elevation: 14 },
                            }),
                        }}
                    >
                        {/* Header */}
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

                        {/* Progress */}
                        <View style={{ flexDirection: "row", gap: 6, marginBottom: 20 }}>
                            {[0, 1, 2, 3, 4].map((i) => (
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

                        {/* Step title */}
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

                        {/* Step content — scrollable pra não empurrar botões pra fora */}
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
                                        value={data.daysPerWeek}
                                        onChange={(v) => setData({ ...data, daysPerWeek: v })}
                                    />
                                )}
                                {step === 2 && (
                                    <StepIntensity
                                        value={data.intensity}
                                        onChange={(v) => setData({ ...data, intensity: v })}
                                    />
                                )}
                                {step === 3 && (
                                    <StepGoal
                                        value={data.goal}
                                        onChange={(v) => setData({ ...data, goal: v })}
                                    />
                                )}
                                {step === 4 && <StepResult data={data} />}
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

                            {step < 4 ? (
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
                                            Próximo
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
                    </LinearGradient>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}
