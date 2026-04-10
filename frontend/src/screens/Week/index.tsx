import { useWeek } from "@/src/hooks/useWeek";
import { RootStackParamList } from "@/src/router/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useLayoutEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { AddMachineModal } from "../../components/AddMachineModal";
import { AIWizard } from "../../components/AIWizard";
import { GPTResponse, WizardData } from "../../components/AIWizard/types";
import { AnimatedCard } from "../../components/AnimatedCard";
import { CategoryBadge } from "../../components/CategoryBadge";
import { ConfirmModal } from "../../components/ConfirmModal";
import { GradientCard } from "../../components/GradientCard";
import { DAYS_LABEL, MachineCategoryKey } from "../../constants/categories";
import { useAuth } from "../../contexts/AuthContext";
import { Machine } from "../../dtos/Machine";
import { generateAIWorkout } from "../../services/aiWorkout";
import { replaceWeekWithMachines } from "../../services/workoutData";
import { useTheme } from "../../contexts/ThemeContext";

type Nav = NativeStackNavigationProp<RootStackParamList, "Week">;

const CATEGORY_ALIASES: Record<MachineCategoryKey, string[]> = {
    peito: ["peito", "supino", "crucifixo", "chest", "peitoral"],
    costas: ["costas", "remada", "puxada", "barra", "pulldown", "rowing", "back"],
    pernas: [
        "perna",
        "pernas",
        "quadriceps",
        "posterior",
        "gluteo",
        "gluteos",
        "leg",
        "panturrilha",
        "agachamento",
        "cadeira",
        "mesa flexora",
    ],
    ombros: ["ombro", "ombros", "shoulder", "desenvolvimento", "elevacao lateral"],
    biceps: ["biceps", "bíceps", "rosca", "curl"],
    triceps: ["triceps", "tríceps", "triceps", "corda", "testa", "pulley"],
    core: ["core", "abdomen", "abdominal", "prancha", "lombar"],
    cardio: ["cardio", "esteira", "bike", "bicicleta", "eliptico", "elíptico", "corrida"],
};

function normalizeText(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function inferCategoryKey(categoryName: string, machineName: string): MachineCategoryKey {
    const haystack = normalizeText(`${categoryName} ${machineName}`);

    for (const [key, aliases] of Object.entries(CATEGORY_ALIASES) as [
        MachineCategoryKey,
        string[],
    ][]) {
        if (aliases.some((alias) => haystack.includes(normalizeText(alias)))) {
            return key;
        }
    }

    return "peito";
}

function buildGeneratedWeek(response: GPTResponse): Record<number, Omit<Machine, "id">[]> {
    const generatedDays: Record<number, Omit<Machine, "id">[]> = {
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
    };

    response.categories.forEach((category) => {
        category.days.forEach((dayIndex) => {
            if (!(dayIndex in generatedDays)) return;

            const machines = category.machines.map((machine) => ({
                name: machine.name,
                categoryKey: inferCategoryKey(category.name, machine.name),
                description: `${category.name} • Series sugeridas (kg): ${machine.sets.join(" / ")}`,
            }));

            generatedDays[dayIndex] = [...generatedDays[dayIndex], ...machines];
        });
    });

    return generatedDays;
}

export default function WeekScreen() {
    const { t } = useTheme();
    const { user } = useAuth();

    const navigation = useNavigation<Nav>();

    const { days, addMachineToDay, refresh } = useWeek();

    const [addTarget, setAddTarget] = useState<number | null>(null);
    const [wizardVisible, setWizardVisible] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);

    const today = new Date().getDay();

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: user?.hasAiPlan
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
    }, [navigation, t.accent, user?.hasAiPlan]);

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh]),
    );

    const handleGenerateWorkout = useCallback(
        async (wizardData: WizardData) => {
            const response = await generateAIWorkout(wizardData);
            const generatedWeek = buildGeneratedWeek(response);

            await replaceWeekWithMachines(generatedWeek);
            await refresh();
            setSuccessVisible(true);
        },
        [refresh],
    );

    return (
        <View style={{ flex: 1, backgroundColor: t.bg, padding: 16 }}>
            <Text
                style={{
                    color: t.textDim,
                    fontSize: 11,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    marginBottom: 18,
                    marginLeft: 2,
                }}
            >
                sua semana
            </Text>

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
                                    if (!isEmpty) {
                                        navigation.navigate("Day", { dayIndex });
                                    }
                                }}
                                onLongPress={() => setAddTarget(dayIndex)}
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
                                            {DAYS_LABEL[dayIndex]}
                                        </Text>
                                        {isToday && (
                                            <View
                                                style={{
                                                    backgroundColor: t.accent,
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 2,
                                                    borderRadius: 8,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color:
                                                            t.mode === "dark" ? "#0d0500" : "#FFF",
                                                        fontSize: 10,
                                                        fontWeight: "800",
                                                    }}
                                                >
                                                    HOJE
                                                </Text>
                                            </View>
                                        )}
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
                                            Nenhuma máquina — segure para adicionar
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
                                            {[...new Set(machines.map((m) => m.categoryKey))].map(
                                                (key) => (
                                                    <CategoryBadge key={key} categoryKey={key} />
                                                ),
                                            )}
                                            <Text
                                                style={{
                                                    color: t.textDim,
                                                    fontSize: 11,
                                                    alignSelf: "center",
                                                    marginLeft: 2,
                                                }}
                                            >
                                                {machines.length} máquina
                                                {machines.length !== 1 ? "s" : ""}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                {!isEmpty && (
                                    <Ionicons
                                        name="chevron-forward"
                                        size={18}
                                        color={t.textMuted}
                                    />
                                )}
                            </GradientCard>
                        </AnimatedCard>
                    );
                }}
            />

            <AddMachineModal
                visible={addTarget !== null}
                onClose={() => setAddTarget(null)}
                onAdd={(name, catKey, desc) => {
                    if (addTarget !== null) addMachineToDay(addTarget, name, catKey, desc);
                    setAddTarget(null);
                }}
            />

            <AIWizard
                visible={wizardVisible}
                onClose={() => setWizardVisible(false)}
                onFinish={handleGenerateWorkout}
            />

            <ConfirmModal
                visible={successVisible}
                onClose={() => setSuccessVisible(false)}
                onConfirm={() => setSuccessVisible(false)}
                title="Treino gerado"
                message="Seu treino automatico foi criado com sucesso e substituiu a semana atual."
                confirmLabel="Fechar"
                hideCancel
                confirmVariant="accent"
            />
        </View>
    );
}
