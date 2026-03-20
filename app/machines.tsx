import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useMachines } from "./hooks/useStorage";
import { useState } from "react";
import { AddModal } from "./components/AddModal";
import { EmptyState } from "./components/EmptyState";
import { Ionicons } from "@expo/vector-icons";
import { s } from "./styles/theme";

export function MachinesScreen() {
  const router = useRouter();
  const { categoryId, categoryName } = useLocalSearchParams<{
    categoryId: string;
    categoryName: string;
  }>();
  const { machines, addMachine } = useMachines(categoryId);
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={s.container}>
      <Stack.Screen
        options={{
          title: categoryName ?? "Máquinas",
          headerRight: () => (
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Ionicons name="add-circle" size={28} color="#F4A261" />
            </TouchableOpacity>
          ),
        }}
      />

      <Text style={s.subtitle}>máquinas</Text>

      {machines.length === 0 ? (
        <EmptyState
          icon="cog-outline"
          message="Nenhuma máquina ainda"
          hint='Toque no "+" para adicionar'
        />
      ) : (
        <FlatList
          data={machines}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 10, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.card}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: "/detail",
                  params: {
                    categoryId,
                    machineId: item.id,
                    machineName: item.name,
                  },
                })
              }
            >
              <View style={s.cardIcon}>
                <Ionicons name="cog" size={24} color="#F4A261" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{item.name}</Text>
                <Text style={s.cardSub}>
                  {item.currentWeight ? `${item.currentWeight} kg` : "sem registro"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#7A2E00" />
            </TouchableOpacity>
          )}
        />
      )}

      <AddModal
        visible={modalVisible}
        title="Nova Máquina"
        placeholder="Ex: Supino Reto, Leg Press..."
        onClose={() => setModalVisible(false)}
        onAdd={(name) => {
          addMachine(name);
          setModalVisible(false);
        }}
      />
    </View>
  );
}

export default MachinesScreen;