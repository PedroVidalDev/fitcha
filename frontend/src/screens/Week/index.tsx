import { RootStackParamList } from "@/src/router/types";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useLayoutEffect, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { AddMachineModal } from "../../components/AddMachineModal";
import { AIWizard } from "../../components/AIWizard";
import { AnimatedCard } from "../../components/AnimatedCard";
import { CategoryBadge } from "../../components/CategoryBadge";
import { ConfirmModal } from "../../components/ConfirmModal";
import { GradientCard } from "../../components/GradientCard";
import { DAYS_LABEL } from "../../constants/categories";
import { useTheme } from "../../contexts/ThemeContext";
import { useWeek } from "../../hooks/useStorage";

type Nav = NativeStackNavigationProp<RootStackParamList, "Week">;

export default function WeekScreen() {
    const navigation = useNavigation<Nav>();
    const { days, addMachineToDay, removeMachineFromDay, refresh } = useWeek();
    const { t } = useTheme();
    const [addTarget, setAddTarget] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{
        day: number;
        machineId: string;
        name: string;
    } | null>(null);
    const [wizardVisible, setWizardVisible] = useState(false);

    const today = new Date().getDay();

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={() => setWizardVisible(true)} style={{ padding: 6 }}>
                    <Ionicons name="sparkles" size={22} color={t.accent} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, t.accent]);

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

            <ConfirmModal
                visible={!!deleteTarget}
                title="Remover máquina"
                message={`Remover "${deleteTarget?.name}" deste dia?`}
                confirmLabel="Remover"
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (deleteTarget)
                        removeMachineFromDay(deleteTarget.day, deleteTarget.machineId);
                    setDeleteTarget(null);
                }}
            />

            <AIWizard
                visible={wizardVisible}
                onClose={() => setWizardVisible(false)}
                onFinish={(prompt) => {
                    Alert.alert("Prompt gerado", prompt.substring(0, 200) + "...", [
                        { text: "OK" },
                    ]);
                    console.log("=== PROMPT COMPLETO ===");
                    console.log(prompt);
                }}
            />
        </View>
    );
}
