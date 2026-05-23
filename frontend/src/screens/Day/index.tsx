import { AddMachineModal } from "@/src/components/AddMachineModal";
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
import { useI18n } from "../../contexts/I18nContext";
import { useTheme } from "../../contexts/ThemeContext";

type Nav = NativeStackNavigationProp<RootStackParamList, "Day">;
type Route = RouteProp<RootStackParamList, "Day">;

export default function DayScreen() {
    const { t } = useTheme();
    const { t: translate } = useI18n();

    const navigation = useNavigation<Nav>();
    const route = useRoute<Route>();
    const day = route.params.dayIndex;

    const { addMachineToDay, removeMachineFromDay } = useWeek();
    const { machines, refresh } = useDayMachines(day);

    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";
    const totalMachines = machines.length;

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
                        right: -18,
                        top: -26,
                        width: 90,
                        height: 90,
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
                    {translate("day.machineCount", {
                        count: totalMachines,
                        pluralSuffix: totalMachines !== 1 ? "s" : "",
                    })}
                </Text>
                <Text
                    style={{
                        color: t.textPrimary,
                        fontSize: 24,
                        fontWeight: "900",
                        marginTop: 8,
                    }}
                >
                    {totalMachines > 0
                        ? translate("common.actions.startWorkout")
                        : translate("day.addButton")}
                </Text>
                <Text
                    style={{
                        color: t.textMuted,
                        fontSize: 13,
                        lineHeight: 19,
                        marginTop: 8,
                    }}
                >
                    {totalMachines > 0
                        ? translate("day.machineCount", {
                              count: totalMachines,
                              pluralSuffix: totalMachines !== 1 ? "s" : "",
                          })
                        : translate("week.emptyDay")}
                </Text>
            </LinearGradient>

            <TouchableOpacity activeOpacity={0.8} onPress={() => setIsAddModalVisible(true)}>
                <LinearGradient
                    colors={t.gradientAccent}
                    style={{
                        borderRadius: 16,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        marginBottom: 16,
                    }}
                >
                    <Ionicons name="add-circle" size={22} color={btnColor} />
                    <Text style={{ color: btnColor, fontSize: 16, fontWeight: "900" }}>
                        {translate("day.addButton")}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>

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
                                    style={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: t.border,
                                    }}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View
                                    style={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: 12,
                                        backgroundColor: t.chipBg,
                                        borderWidth: 1,
                                        borderColor: t.border,
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
                                        <Text
                                            style={{
                                                color: t.accent,
                                                fontSize: 12,
                                                fontWeight: "700",
                                            }}
                                        >
                                            {translate("day.maxWeight", {
                                                weight: item.lastWeight,
                                            })}
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
                                {translate("common.actions.startWorkout")}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            <AddMachineModal
                visible={isAddModalVisible}
                onClose={() => setIsAddModalVisible(false)}
                onAdd={async (catalogMachineId) => {
                    await addMachineToDay(day, catalogMachineId);
                    await refresh();
                }}
            />

            <ConfirmModal
                visible={!!deleteTarget}
                title={translate("day.remove.title")}
                message={translate("day.remove.message", { name: deleteTarget?.name ?? "" })}
                confirmLabel={translate("common.actions.remove")}
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
