import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { AddModal } from "./components/AddModal";
import { AnimatedCard } from "./components/AnimatedCard";
import { ConfirmModal } from "./components/ConfirmModal";
import { EmptyState } from "./components/EmptyState";
import { GradientCard } from "./components/GradientCard";
import { useTheme } from "./contexts/ThemeContext";
import { useMachines } from "./hooks/useStorage";

export default function MachinesScreen() {
  const router = useRouter();
  const { categoryId, categoryName } = useLocalSearchParams<{
    categoryId: string; categoryName: string;
  }>();
  const { machines, addMachine, deleteMachine } = useMachines(categoryId);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const { t } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, padding: 16 }}>
      <Stack.Screen
        options={{
          title: categoryName ?? "Máquinas",
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity onPress={() => setModalVisible(true)} style={{ padding: 4 }}>
                <Ionicons name="add-circle" size={28} color={t.accent} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <Text style={{
        color: t.textDim, fontSize: 11, fontWeight: "700",
        textTransform: "uppercase", letterSpacing: 2, marginBottom: 18, marginLeft: 2,
      }}>
        máquinas
      </Text>

      {machines.length === 0 ? (
        <EmptyState icon="cog-outline" message="Nenhuma máquina ainda" hint='Toque no "+" para adicionar' />
      ) : (
        <FlatList
          data={machines}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <AnimatedCard index={index}>
              <GradientCard
                onPress={() =>
                  router.push({
                    pathname: "/detail",
                    params: { categoryId, machineId: item.id, machineName: item.name },
                  })
                }
                onLongPress={() => setDeleteTarget({ id: item.id, name: item.name })}
              >
                <View style={{
                  width: 44, height: 44, borderRadius: 13,
                  backgroundColor: t.chipBg, justifyContent: "center", alignItems: "center",
                }}>
                  <Ionicons name="cog" size={22} color={t.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.textPrimary, fontSize: 16, fontWeight: "700" }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 3, fontWeight: "500" }}>
                    {item.currentWeight ? `${item.currentWeight} kg` : "sem registro"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
              </GradientCard>
            </AnimatedCard>
          )}
        />
      )}

      <AddModal
        visible={modalVisible}
        title="Nova Máquina"
        placeholder="Ex: Supino Reto, Leg Press..."
        onClose={() => setModalVisible(false)}
        onAdd={(name) => { addMachine(name); setModalVisible(false); }}
      />

      <ConfirmModal
        visible={!!deleteTarget}
        title="Remover máquina"
        message={`Deseja remover "${deleteTarget?.name}"? Todo o histórico será apagado.`}
        confirmLabel="Remover"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMachine(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </View>
  );
}