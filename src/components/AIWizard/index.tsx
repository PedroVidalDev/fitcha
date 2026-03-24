import { Modal, View, Text, TouchableOpacity, Animated, Platform, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { WizardData, WizardStep } from "./types";
import { buildGPTPrompt, buildExpectedJSON } from "./prompt";

type Props = {
  visible: boolean;
  onClose: () => void;
  onFinish: (prompt: string) => void;
};

export function AIWizard({ visible, onClose, onFinish }: Props) {
  const { t } = useTheme();
  const [step, setStep] = useState<WizardStep>(0);
  const [data, setData] = useState<WizardData>({
    daysPerWeek: null,
    intensity: null,
    goal: null,
  });

  const scale = useRef(new Animated.Value(0.9)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep(0);
      setData({ daysPerWeek: null, intensity: null, goal: null });
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 65, friction: 8, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.9);
      fade.setValue(0);
    }
  }, [visible]);

  const animateStep = (nextStep: WizardStep) => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -30, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 30, duration: 0, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }).start();
    });
  };

  const goNext = () => {
    if (step < 3) animateStep((step + 1) as WizardStep);
  };

  const goBack = () => {
    if (step > 0) animateStep((step - 1) as WizardStep);
  };

  const handleClose = () => {
    setStep(0);
    setData({ daysPerWeek: null, intensity: null, goal: null });
    onClose();
  };

  const canProceed =
    (step === 0 && data.daysPerWeek !== null) ||
    (step === 1 && data.intensity !== null) ||
    (step === 2 && data.goal !== null) ||
    step === 3;

  const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";

  const stepTitles = [
    "Quantos dias por semana?",
    "Qual a intensidade?",
    "Qual seu objetivo?",
    "Prompt gerado",
  ];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={{
        flex: 1, backgroundColor: t.overlay, justifyContent: "center",
        alignItems: "center", padding: 20, opacity: fade,
      }}>
        <Animated.View style={{ transform: [{ scale }], width: "100%" }}>
          <LinearGradient colors={t.gradientModal} style={{
            width: "100%", borderRadius: 24, padding: 24,
            borderWidth: 0.5, borderColor: t.border,
            maxHeight: "85%",
            ...Platform.select({
              ios: { shadowColor: t.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
              android: { elevation: 14 },
            }),
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Ionicons name="sparkles" size={22} color={t.accent} />
                <Text style={{ color: t.accent, fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 }}>
                  treino com ia
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color={t.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", gap: 6, marginBottom: 20 }}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  backgroundColor: i <= step ? t.accent : t.inputBg,
                }} />
              ))}
            </View>

            <Text style={{ color: t.textPrimary, fontSize: 20, fontWeight: "800", marginBottom: 20 }}>
              {stepTitles[step]}
            </Text>

            <ScrollView
              style={{ maxHeight: 320 }}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
                {step === 0 && (
                  <StepDays
                    value={data.daysPerWeek}
                    onChange={(v) => setData({ ...data, daysPerWeek: v })}
                  />
                )}
                {step === 1 && (
                  <StepIntensity
                    value={data.intensity}
                    onChange={(v) => setData({ ...data, intensity: v })}
                  />
                )}
                {step === 2 && (
                  <StepGoal
                    value={data.goal}
                    onChange={(v) => setData({ ...data, goal: v })}
                  />
                )}
                {step === 3 && (
                  <StepResult data={data} />
                )}
              </Animated.View>
            </ScrollView>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 24 }}>
              {step > 0 ? (
                <TouchableOpacity onPress={goBack} style={{ padding: 12 }}>
                  <Text style={{ color: t.textMuted, fontSize: 15, fontWeight: "600" }}>Voltar</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}

              {step < 3 ? (
                <TouchableOpacity
                  onPress={goNext}
                  activeOpacity={0.75}
                  disabled={!canProceed}
                  style={{ opacity: canProceed ? 1 : 0.4 }}
                >
                  <LinearGradient colors={t.gradientAccent}
                    style={{ paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 }}
                  >
                    <Text style={{ color: btnColor, fontSize: 15, fontWeight: "800" }}>
                      Próximo
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    const prompt = buildGPTPrompt(data);
                    onFinish(prompt);
                    handleClose();
                  }}
                  activeOpacity={0.75}
                >
                  <LinearGradient colors={t.gradientAccent}
                    style={{
                      paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12,
                      flexDirection: "row", alignItems: "center", gap: 8,
                    }}
                  >
                    <Ionicons name="sparkles" size={16} color={btnColor} />
                    <Text style={{ color: btnColor, fontSize: 15, fontWeight: "800" }}>
                      Gerar treino
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


function StepDays({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const { t } = useTheme();
  const options = [2, 3, 4, 5, 6];

  return (
    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
      {options.map((n) => {
        const active = value === n;
        return (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            activeOpacity={0.7}
            style={{
              paddingVertical: 16, paddingHorizontal: 22,
              borderRadius: 14,
              backgroundColor: active ? t.accent : t.inputBg,
              borderWidth: 0.5,
              borderColor: active ? t.accent : t.border,
            }}
          >
            <Text style={{
              fontSize: 18, fontWeight: "900",
              color: active ? (t.mode === "dark" ? "#0d0500" : "#FFF") : t.textMuted,
            }}>
              {n}x
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}


function StepIntensity({ value, onChange }: {
  value: "leve" | "moderado" | "intenso" | null;
  onChange: (v: "leve" | "moderado" | "intenso") => void;
}) {
  const { t } = useTheme();
  const options: { key: "leve" | "moderado" | "intenso"; icon: string; desc: string }[] = [
    { key: "leve", icon: "leaf-outline", desc: "Iniciante ou retorno" },
    { key: "moderado", icon: "flame-outline", desc: "Treino consistente" },
    { key: "intenso", icon: "flash-outline", desc: "Alto volume e carga" },
  ];

  return (
    <View style={{ gap: 10 }}>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.7}
            style={{
              flexDirection: "row", alignItems: "center", gap: 14,
              padding: 16, borderRadius: 14,
              backgroundColor: active ? t.accent : t.inputBg,
              borderWidth: 0.5,
              borderColor: active ? t.accent : t.border,
            }}
          >
            <Ionicons
              name={opt.icon as any}
              size={22}
              color={active ? (t.mode === "dark" ? "#0d0500" : "#FFF") : t.textMuted}
            />
            <View>
              <Text style={{
                fontSize: 15, fontWeight: "800", textTransform: "capitalize",
                color: active ? (t.mode === "dark" ? "#0d0500" : "#FFF") : t.textPrimary,
              }}>
                {opt.key}
              </Text>
              <Text style={{
                fontSize: 12, marginTop: 2,
                color: active ? (t.mode === "dark" ? "rgba(13,5,0,0.6)" : "rgba(255,255,255,0.7)") : t.textMuted,
              }}>
                {opt.desc}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}


function StepGoal({ value, onChange }: {
  value: "hipertrofia" | "forca" | "resistencia" | "emagrecimento" | null;
  onChange: (v: "hipertrofia" | "forca" | "resistencia" | "emagrecimento") => void;
}) {
  const { t } = useTheme();
  const options: { key: "hipertrofia" | "forca" | "resistencia" | "emagrecimento"; icon: string; desc: string }[] = [
    { key: "hipertrofia", icon: "body-outline", desc: "Ganho de massa muscular" },
    { key: "forca", icon: "barbell-outline", desc: "Aumento de carga máxima" },
    { key: "resistencia", icon: "heart-outline", desc: "Mais repetições e stamina" },
    { key: "emagrecimento", icon: "trending-down-outline", desc: "Perda de gordura com treino" },
  ];

  return (
    <View style={{ gap: 10 }}>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.7}
            style={{
              flexDirection: "row", alignItems: "center", gap: 14,
              padding: 16, borderRadius: 14,
              backgroundColor: active ? t.accent : t.inputBg,
              borderWidth: 0.5,
              borderColor: active ? t.accent : t.border,
            }}
          >
            <Ionicons
              name={opt.icon as any}
              size={22}
              color={active ? (t.mode === "dark" ? "#0d0500" : "#FFF") : t.textMuted}
            />
            <View>
              <Text style={{
                fontSize: 15, fontWeight: "800", textTransform: "capitalize",
                color: active ? (t.mode === "dark" ? "#0d0500" : "#FFF") : t.textPrimary,
              }}>
                {opt.key}
              </Text>
              <Text style={{
                fontSize: 12, marginTop: 2,
                color: active ? (t.mode === "dark" ? "rgba(13,5,0,0.6)" : "rgba(255,255,255,0.7)") : t.textMuted,
              }}>
                {opt.desc}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}


function StepResult({ data }: { data: WizardData }) {
  const { t } = useTheme();
  const prompt = buildGPTPrompt(data);
  const expectedJSON = buildExpectedJSON();

  return (
    <View>
      <Text style={{ color: t.textDim, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        mensagem que será enviada
      </Text>
      <View style={{
        backgroundColor: t.inputBg, borderRadius: 12, padding: 14,
        borderWidth: 0.5, borderColor: t.border, marginBottom: 16,
      }}>
        <Text style={{ color: t.textPrimary, fontSize: 13, lineHeight: 20 }}>{prompt}</Text>
      </View>

      <Text style={{ color: t.textDim, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        json esperado de resposta
      </Text>
      <View style={{
        backgroundColor: t.inputBg, borderRadius: 12, padding: 14,
        borderWidth: 0.5, borderColor: t.border,
      }}>
        <Text style={{ color: t.textMuted, fontSize: 11, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", lineHeight: 18 }}>
          {expectedJSON}
        </Text>
      </View>
    </View>
  );
}