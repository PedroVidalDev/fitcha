import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useCategories } from "./hooks/useStorage";
import { useState } from "react";
import { AddModal } from "./components/AddModal";
import { EmptyState } from "./components/EmptyState";
import { AnimatedCard } from "./components/AnimatedCard";
import { GradientCard } from "./components/GradientCard";
import { Ionicons } from "@expo/vector-icons";
import { s } from "./styles/theme";

export default function Index() {
  const router = useRouter();
  const { categories, addCategory } = useCategories();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={s.container}>
      <Stack.Screen
        options={{
          title: "Ferragem",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={s.headerBtn}
            >
              <Ionicons name="add-circle" size={28} color="#F4A261" />
            </TouchableOpacity>
          ),
        }}
      />

      <Text style={s.subtitle}>categorias de treino</Text>

      {categories.length === 0 ? (
        <EmptyState
          icon="barbell-outline"
          message="Nenhuma categoria ainda"
          hint='Toque no "+" para criar'
        />
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
                <View style={s.cardIcon}>
                  <Ionicons name="fitness" size={22} color="#F4A261" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{item.name}</Text>
                  <Text style={s.cardSub}>
                    {item.machineCount} máquina{item.machineCount !== 1 ? "s" : ""}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#8B4513" />
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
        onAdd={(name) => {
          addCategory(name);
          setModalVisible(false);
        }}
      />
    </View>
  );
}