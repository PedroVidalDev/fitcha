import { useDayMachines } from "@/src/hooks/useDayMachines";
import { useSaveWorkout } from "@/src/screens/Workout/hooks/useSaveWorkout";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
    Image,
    Animated as RNAnimated,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { CategoryBadge } from "../../components/CategoryBadge";
import { ConfirmModal } from "../../components/ConfirmModal";
import { useTheme } from "../../contexts/ThemeContext";
import {
    buildWorkoutResults,
    formatTime,
    getWorkoutDraft,
    hasDraftValue,
    isDraftComplete,
} from "./helpers";
import { Route, WorkoutDraft, WorkoutDraftMap, WorkoutModalConfig, WorkoutResult } from "./types";

export default function WorkoutScreen() {
    const { t } = useTheme();

    const navigation = useNavigation();
    const route = useRoute<Route>();
    const day = route.params.dayIndex;

    const { machines } = useDayMachines(day);
    const saveWorkout = useSaveWorkout();

    const [currentIdx, setCurrentIdx] = useState(0);
    const [drafts, setDrafts] = useState<WorkoutDraftMap>({});
    const [elapsed, setElapsed] = useState(0);
    const [modal, setModal] = useState<WorkoutModalConfig | null>(null);
    const startTime = useRef(Date.now()).current;

    const machine = machines[currentIdx];
    const isLast = currentIdx === machines.length - 1;
    const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";
    const currentDraft = machine ? getWorkoutDraft(drafts[machine.id]) : getWorkoutDraft();
    const completedCount = machines.filter((item) => isDraftComplete(drafts[item.id])).length;
    const pendingCount = machines.length - completedCount;
    const hasAnyDrafts = machines.some((item) => hasDraftValue(drafts[item.id]));
    const currentHasDraft = hasDraftValue(currentDraft);
    const currentIsComplete = isDraftComplete(currentDraft);

    const openModal = (config: WorkoutModalConfig) => {
        setModal(config);
    };

    const closeModal = () => {
        setModal(null);
    };

    const handleModalConfirm = () => {
        const action = modal?.onConfirm;
        closeModal();
        action?.();
    };

    const updateDraftField = (field: keyof WorkoutDraft, value: string) => {
        if (!machine) return;

        setDrafts((prev) => ({
            ...prev,
            [machine.id]: {
                ...getWorkoutDraft(prev[machine.id]),
                [field]: value,
            },
        }));
    };

    const goToMachine = (idx: number) => {
        if (idx < 0 || idx >= machines.length || idx === currentIdx) return;
        setCurrentIdx(idx);
    };

    const buildResults = (): WorkoutResult[] =>
        buildWorkoutResults(
            machines.map((item) => item.id),
            drafts,
        );

    const showSavedWorkoutModal = (finalResults: WorkoutResult[]) => {
        openModal({
            title: "Treino finalizado!",
            message: `${finalResults.length} maquina${finalResults.length > 1 ? "s" : ""} registrada${finalResults.length > 1 ? "s" : ""} em ${formatTime(elapsed)}`,
            confirmLabel: "Fechar",
            hideCancel: true,
            confirmVariant: "accent",
            onConfirm: () => navigation.goBack(),
        });
    };

    const showEmptyWorkoutModal = () => {
        openModal({
            title: "Treino vazio",
            message: "Nenhum peso foi registrado.",
            confirmLabel: "Fechar",
            hideCancel: true,
            confirmVariant: "accent",
            onConfirm: () => navigation.goBack(),
        });
    };

    const showSaveErrorModal = () => {
        openModal({
            title: "Erro ao salvar",
            message: "Nao foi possivel salvar o treino agora. Tente novamente em instantes.",
            confirmLabel: "Fechar",
            hideCancel: true,
            confirmVariant: "accent",
            onConfirm: () => {},
        });
    };

    const finishWorkout = async (finalResults: WorkoutResult[]) => {
        if (finalResults.length === 0) {
            showEmptyWorkoutModal();
            return;
        }

        try {
            await saveWorkout(finalResults);
            showSavedWorkoutModal(finalResults);
        } catch {
            showSaveErrorModal();
        }
    };

    const handleFinish = () => {
        const finalResults = buildResults();

        if (finalResults.length === 0 && hasAnyDrafts) {
            openModal({
                title: "Nenhuma maquina completa",
                message:
                    "Ainda nao ha exercicio com as 3 series completas. Se sair agora, os rascunhos serao descartados.",
                confirmLabel: "Sair sem salvar",
                confirmVariant: "danger",
                onConfirm: () => navigation.goBack(),
            });
            return;
        }

        if (pendingCount > 0 && finalResults.length > 0) {
            openModal({
                title: "Finalizar com pendencias?",
                message: `${pendingCount} maquina${pendingCount > 1 ? "s ficaram" : " ficou"} sem as 3 series completas. Voce pode salvar agora ou continuar revisando.`,
                confirmLabel: "Finalizar",
                confirmVariant: "accent",
                onConfirm: () => {
                    void finishWorkout(finalResults);
                },
            });
            return;
        }

        void finishWorkout(finalResults);
    };

    const handleNext = () => {
        if (isLast) {
            handleFinish();
            return;
        }

        setCurrentIdx((prev) => Math.min(prev + 1, machines.length - 1));
    };

    const handleQuit = () => {
        openModal({
            title: "Encerrar treino?",
            message: "Se voce sair agora, o treino sera encerrado e nada sera salvo.",
            confirmLabel: "Encerrar",
            confirmVariant: "danger",
            onConfirm: () => navigation.goBack(),
        });
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    const slideAnim = useRef(new RNAnimated.Value(30)).current;
    const fadeAnim = useRef(new RNAnimated.Value(0)).current;

    useEffect(() => {
        slideAnim.setValue(30);
        fadeAnim.setValue(0);
        RNAnimated.parallel([
            RNAnimated.spring(slideAnim, {
                toValue: 0,
                tension: 60,
                friction: 9,
                useNativeDriver: true,
            }),
            RNAnimated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
    }, [currentIdx, fadeAnim, slideAnim]);

    useEffect(() => {
        if (machines.length === 0) return;
        if (currentIdx >= machines.length) {
            setCurrentIdx(machines.length - 1);
        }
    }, [currentIdx, machines.length]);

    if (!machine) return null;

    const seriesFields = [
        {
            key: "set1" as const,
            label: "Serie 1",
            value: currentDraft.set1,
            placeholder: String(machine.lastSets?.[0] ?? 0),
        },
        {
            key: "set2" as const,
            label: "Serie 2",
            value: currentDraft.set2,
            placeholder: String(machine.lastSets?.[1] ?? 0),
        },
        {
            key: "set3" as const,
            label: "Serie 3",
            value: currentDraft.set3,
            placeholder: String(machine.lastSets?.[2] ?? 0),
        },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <LinearGradient
                colors={t.gradientHero}
                style={{
                    paddingTop: 60,
                    paddingBottom: 16,
                    paddingHorizontal: 20,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <TouchableOpacity onPress={handleQuit} style={{ padding: 4 }}>
                    <Ionicons name="close" size={26} color={t.textMuted} />
                </TouchableOpacity>

                <View style={{ alignItems: "center" }}>
                    <Text
                        style={{
                            color: t.accent,
                            fontSize: 32,
                            fontWeight: "900",
                            fontVariant: ["tabular-nums"],
                        }}
                    >
                        {formatTime(elapsed)}
                    </Text>
                    <Text
                        style={{
                            color: t.textDim,
                            fontSize: 11,
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: 1,
                        }}
                    >
                        {currentIdx + 1} de {machines.length}
                    </Text>
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 11,
                            fontWeight: "700",
                            marginTop: 4,
                        }}
                    >
                        {completedCount}/{machines.length} completas
                    </Text>
                </View>

                <View style={{ width: 34 }} />
            </LinearGradient>

            <View
                style={{ flexDirection: "row", gap: 4, paddingHorizontal: 20, paddingVertical: 8 }}
            >
                {machines.map((item, idx) => {
                    const isCurrent = idx === currentIdx;
                    const hasDraft = hasDraftValue(drafts[item.id]);
                    const isComplete = isDraftComplete(drafts[item.id]);

                    return (
                        <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.8}
                            onPress={() => goToMachine(idx)}
                            style={{ flex: 1 }}
                        >
                            <View
                                style={{
                                    height: isCurrent ? 5 : 3,
                                    borderRadius: 999,
                                    backgroundColor: isCurrent
                                        ? t.accent + "80"
                                        : isComplete
                                          ? t.accent
                                          : hasDraft
                                            ? t.accentDark + "70"
                                            : t.inputBg,
                                }}
                            />
                        </TouchableOpacity>
                    );
                })}
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <RNAnimated.View
                    style={{
                        padding: 20,
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }}
                >
                    <View style={{ alignItems: "center", marginBottom: 24 }}>
                        {machine.photo ? (
                            <Image
                                source={{ uri: machine.photo }}
                                style={{
                                    width: "100%",
                                    height: 140,
                                    borderRadius: 16,
                                    marginBottom: 14,
                                }}
                                resizeMode="cover"
                            />
                        ) : (
                            <View
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 20,
                                    backgroundColor: t.chipBg,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    marginBottom: 14,
                                }}
                            >
                                <Ionicons name="barbell-outline" size={36} color={t.accent} />
                            </View>
                        )}

                        <Text
                            style={{
                                color: t.textPrimary,
                                fontSize: 22,
                                fontWeight: "900",
                                textAlign: "center",
                            }}
                        >
                            {machine.name}
                        </Text>
                        <CategoryBadge categoryKey={machine.categoryKey} />
                    </View>

                    <View
                        style={{
                            backgroundColor: t.inputBg,
                            borderRadius: 14,
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                            borderWidth: 0.5,
                            borderColor: t.border,
                            marginBottom: 18,
                        }}
                    >
                        <Text
                            style={{
                                color: currentIsComplete ? t.accent : t.textMuted,
                                fontSize: 13,
                                fontWeight: "800",
                                marginBottom: 4,
                            }}
                        >
                            {currentIsComplete
                                ? "Exercicio registrado"
                                : currentHasDraft
                                  ? "Rascunho salvo"
                                  : "Pode pular sem perder o fluxo"}
                        </Text>
                        <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 18 }}>
                            {currentIsComplete
                                ? "Voce pode seguir adiante ou voltar depois para ajustar os pesos."
                                : currentHasDraft
                                  ? "Os valores ficam guardados ao trocar de maquina. Complete quando ela estiver livre."
                                  : "Se a maquina estiver ocupada, avance agora e volte quando quiser pela barra acima."}
                        </Text>
                    </View>

                    <Text
                        style={{
                            color: t.textDim,
                            fontSize: 11,
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: 2,
                            marginBottom: 12,
                            marginLeft: 4,
                        }}
                    >
                        preencha as 3 series
                    </Text>

                    <View style={{ gap: 10 }}>
                        {seriesFields.map((item) => (
                            <View
                                key={item.key}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 12,
                                    backgroundColor: t.inputBg,
                                    borderRadius: 14,
                                    paddingHorizontal: 16,
                                    paddingVertical: 4,
                                    borderWidth: 0.5,
                                    borderColor: t.border,
                                }}
                            >
                                <Text
                                    style={{
                                        color: t.textDim,
                                        fontSize: 13,
                                        fontWeight: "700",
                                        width: 55,
                                    }}
                                >
                                    {item.label}
                                </Text>
                                <TextInput
                                    style={{
                                        flex: 1,
                                        padding: 14,
                                        color: t.textPrimary,
                                        fontSize: 20,
                                        fontWeight: "800",
                                        textAlign: "center",
                                    }}
                                    placeholder={item.placeholder}
                                    placeholderTextColor={t.textDim}
                                    keyboardType="numeric"
                                    value={item.value}
                                    onChangeText={(value) => updateDraftField(item.key, value)}
                                />
                                <Text style={{ color: t.textMuted, fontSize: 14, fontWeight: "600" }}>
                                    kg
                                </Text>
                            </View>
                        ))}
                    </View>

                    <View style={{ paddingTop: 28, paddingBottom: 20 }}>
                        <View style={{ flexDirection: "row", gap: 12 }}>
                            <TouchableOpacity
                                activeOpacity={0.75}
                                onPress={() => goToMachine(currentIdx - 1)}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    paddingVertical: 16,
                                    paddingHorizontal: 18,
                                    borderRadius: 16,
                                    backgroundColor: t.inputBg,
                                    borderWidth: 0.5,
                                    borderColor: t.border,
                                    flex: 0.95,
                                    opacity: currentIdx === 0 ? 0.45 : 1,
                                }}
                                disabled={currentIdx === 0}
                            >
                                <Ionicons
                                    name="arrow-back-circle-outline"
                                    size={20}
                                    color={t.textMuted}
                                />
                                <Text style={{ color: t.textMuted, fontSize: 16, fontWeight: "800" }}>
                                    Anterior
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.75}
                                onPress={handleNext}
                                style={{ flex: 1.4 }}
                            >
                                <LinearGradient
                                    colors={t.gradientAccent}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 10,
                                        paddingVertical: 16,
                                        borderRadius: 16,
                                    }}
                                >
                                    <Ionicons
                                        name={isLast ? "checkmark-done-circle" : "arrow-forward-circle"}
                                        size={22}
                                        color={btnColor}
                                    />
                                    <Text
                                        style={{ color: btnColor, fontSize: 17, fontWeight: "900" }}
                                    >
                                        {isLast ? "Finalizar treino" : "Proxima maquina"}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <Text
                            style={{
                                color: t.textDim,
                                fontSize: 12,
                                textAlign: "center",
                                marginTop: 14,
                                lineHeight: 18,
                            }}
                        >
                            Toque nas barras acima para ir direto a qualquer exercicio.
                        </Text>
                    </View>
                </RNAnimated.View>
            </ScrollView>

            <ConfirmModal
                visible={!!modal}
                title={modal?.title ?? ""}
                message={modal?.message ?? ""}
                confirmLabel={modal?.confirmLabel}
                cancelLabel={modal?.cancelLabel}
                hideCancel={modal?.hideCancel}
                confirmVariant={modal?.confirmVariant}
                onClose={closeModal}
                onConfirm={handleModalConfirm}
            />
        </View>
    );
}
