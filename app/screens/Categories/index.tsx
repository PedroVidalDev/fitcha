import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Text, TouchableOpacity, View, Alert } from "react-native";
import { AddModal } from "./../../components/AddModal";
import { AnimatedCard } from "./../../components/AnimatedCard";
import { ConfirmModal } from "./../../components/ConfirmModal";
import { EmptyState } from "./../../components/EmptyState";
import { GradientCard } from "./../../components/GradientCard";
import { useTheme } from "./../../contexts/ThemeContext";
import { useCategories } from "./../../hooks/useStorage";
import { DayBadges } from "@/app/components/DayBadges";
import { AIWizard } from "../../components/AIWizard";

const Categories = () => {
  const router = useRouter();

  const { t } = useTheme();

  const { categories, addCategory, deleteCategory } = useCategories();
  const [modalVisible, setModalVisible] = useState(false);
  const [wizardVisible, setWizardVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, padding: 16 }}>
      <Stack.Screen
        options={{
          title: "Fitcha",
          headerLeft: () => (
            <View style={{ flexDirection: "row", gap: 6 }}>
              <TouchableOpacity onPress={() => setModalVisible(true)} style={{ padding: 4 }}>
                <Ionicons name="add-circle" size={28} color={t.accent} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setWizardVisible(true)} style={{ padding: 4 }}>
                <Ionicons name="sparkles" size={26} color={t.accent} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <Text style={{
        color: t.textDim, fontSize: 11, fontWeight: "700",
        textTransform: "uppercase", letterSpacing: 2, marginBottom: 18, marginLeft: 2,
      }}>
        categorias de treino
      </Text>

      {categories.length === 0 ? (
        <EmptyState icon="barbell-outline" message="Nenhuma categoria ainda" hint='Toque no "+" para criar' />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <AnimatedCard index={index}>
              <GradientCard
                onPress={() =>
                  router.push({
                    pathname: "/screens/Machines",
                    params: { categoryId: item.id, categoryName: item.name },
                  })
                }
                onLongPress={() => setDeleteTarget({ id: item.id, name: item.name })}
              >
                <View style={{
                  width: 44, height: 44, borderRadius: 13,
                  backgroundColor: t.chipBg, justifyContent: "center", alignItems: "center",
                }}>
                  <Ionicons name="fitness" size={22} color={t.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.textPrimary, fontSize: 16, fontWeight: "700" }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 3, fontWeight: "500" }}>
                    {item.machineCount} máquina{item.machineCount !== 1 ? "s" : ""}
                  </Text>
                  <DayBadges days={item.days} />
                </View>
                <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
              </GradientCard>
            </AnimatedCard>
          )}
        />
      )}

      <AddModal
        visible={modalVisible}
        title="Nova Categoria"
        placeholder="Ex: Peito, Costas, Pernas..."
        showDayPicker
        onClose={() => setModalVisible(false)}
        onAdd={(name, days) => {
          addCategory(name, days ?? []);
          setModalVisible(false);
        }}
      />

      <ConfirmModal
        visible={!!deleteTarget}
        title="Remover categoria"
        message={`Deseja remover "${deleteTarget?.name}"? Todas as máquinas e históricos desta categoria serão apagados.`}
        confirmLabel="Remover"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteCategory(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />

      <AIWizard
        visible={wizardVisible}
        onClose={() => setWizardVisible(false)}
        onFinish={(prompt) => {
          Alert.alert(
            "Prompt gerado",
            prompt.substring(0, 200) + "...",
            [{ text: "OK" }]
          );
          console.log("=== PROMPT COMPLETO ===");
          console.log(prompt);
        }}
      />
    </View>
  );
}

export default Categories;
