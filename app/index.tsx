import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { AddModal } from "./components/AddModal";
import { AnimatedCard } from "./components/AnimatedCard";
import { EmptyState } from "./components/EmptyState";
import { GradientCard } from "./components/GradientCard";
import { useCategories } from "./hooks/useStorage";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

function InnerIndex() {
  const router = useRouter();
  const { categories, addCategory } = useCategories();
  const [modalVisible, setModalVisible] = useState(false);
  const { t } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, padding: 16 }}>
      <Stack.Screen
        options={{
          title: "Ferragem",
          headerLeft: () => (
            <TouchableOpacity onPress={() => setModalVisible(true)} style={{ padding: 4 }}>
              <Ionicons name="add-circle" size={28} color={t.accent} />
            </TouchableOpacity>
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
                    pathname: "/machines",
                    params: { categoryId: item.id, categoryName: item.name },
                  })
                }
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
        onClose={() => setModalVisible(false)}
        onAdd={(name) => { addCategory(name); setModalVisible(false); }}
      />
    </View>
  );
}

export default function Index() {
  return (
    <InnerIndex />
  );
}