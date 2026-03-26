import { useDayMachines } from "@/src/hooks/useDayMachines";
import { useWeek } from "@/src/hooks/useWeek";
import { RootStackParamList } from "@/src/router/types";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { AnimatedCard } from "../../components/AnimatedCard";
import { CategoryBadge } from "../../components/CategoryBadge";
import { ConfirmModal } from "../../components/ConfirmModal";
import { GradientCard } from "../../components/GradientCard";
import { useTheme } from "../../contexts/ThemeContext";

type Nav = NativeStackNavigationProp<RootStackParamList, "Day">;
type Route = RouteProp<RootStackParamList, "Day">;

export default function DayScreen() {
    const { t } = useTheme();

    const navigation = useNavigation<Nav>();
    const route = useRoute<Route>();
    const day = route.params.dayIndex;

    const { removeMachineFromDay } = useWeek();
    const { machines, refresh } = useDayMachines(day);

    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";

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
                {machines.length} máquina{machines.length !== 1 ? "s" : ""}
            </Text>

            <FlatList
                data={machines}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ gap: 12, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                    <AnimatedCard index={index}>
                        <GradientCard
                            onPress={() => navigation.push("MachineDetail", { machineId: item.id })}
                            onLongPress={() =>
                                setDeleteTarget({
                                    id: item.id,
                                    name: item.name,
                                })
                            }
                        >
                            {item.photo ? (
                                <Image
                                    source={{ uri: item.photo }}
                                    style={{ width: 50, height: 50, borderRadius: 12 }}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View
                                    style={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: 12,
                                        backgroundColor: t.chipBg,
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                >
                                    <Ionicons name="barbell-outline" size={22} color={t.accent} />
                                </View>
                            )}
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        color: t.textPrimary,
                                        fontSize: 16,
                                        fontWeight: "700",
                                    }}
                                >
                                    {item.name}
                                </Text>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 8,
                                        marginTop: 4,
                                    }}
                                >
                                    <CategoryBadge categoryKey={item.categoryKey} />
                                    {item.lastWeight && (
                                        <Text style={{ color: t.textMuted, fontSize: 12 }}>
                                            máx {item.lastWeight}kg
                                        </Text>
                                    )}
                                </View>
                                {item.description && (
                                    <Text
                                        style={{ color: t.textDim, fontSize: 12, marginTop: 4 }}
                                        numberOfLines={1}
                                    >
                                        {item.description}
                                    </Text>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
                        </GradientCard>
                    </AnimatedCard>
                )}
            />

            {/* Botão iniciar treino */}
            {machines.length > 0 && (
                <View style={{ position: "absolute", bottom: 24, left: 16, right: 16 }}>
                    <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => navigation.navigate("Workout", { dayIndex: day })}
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
                            <Ionicons name="play-circle" size={24} color={btnColor} />
                            <Text style={{ color: btnColor, fontSize: 18, fontWeight: "900" }}>
                                Iniciar treino
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            <ConfirmModal
                visible={!!deleteTarget}
                title="Remover máquina"
                message={`Remover "${deleteTarget?.name}" deste dia? O histórico será mantido se estiver em outro dia.`}
                confirmLabel="Remover"
                onClose={() => setDeleteTarget(null)}
                onConfirm={async () => {
                    if (deleteTarget) {
                        await removeMachineFromDay(day, deleteTarget.id);
                        refresh();
                    }
                    setDeleteTarget(null);
                }}
            />
        </View>
    );
}
