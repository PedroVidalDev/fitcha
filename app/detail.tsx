import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useMachineDetail } from "./hooks/useStorage";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { s } from "./styles/theme";

export function DetailScreen() {
  const { categoryId, machineId, machineName } = useLocalSearchParams<{
    categoryId: string;
    machineId: string;
    machineName: string;
  }>();

  const { currentWeight, history, addEntry } = useMachineDetail(categoryId, machineId);
  const [weight, setWeight] = useState("");

  const handleSave = () => {
    const num = parseFloat(weight.replace(",", "."));
    if (isNaN(num) || num <= 0) return;
    addEntry(num);
    setWeight("");
  };

  return (
    <View style={s.container}>
      <Stack.Screen options={{ title: machineName ?? "Detalhe" }} />

      {/* Peso atual */}
      <View style={s.currentBlock}>
        <Text style={s.currentLabel}>peso atual</Text>
        <Text style={s.currentWeight}>
          {currentWeight ?? "—"}
          {currentWeight != null && <Text style={s.currentUnit}> kg</Text>}
        </Text>
      </View>

      {/* Input de novo peso */}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Novo peso (kg)"
          placeholderTextColor="#7A2E00"
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
          onSubmitEditing={handleSave}
        />
        <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
          <Ionicons name="checkmark" size={22} color="#0d0500" />
        </TouchableOpacity>
      </View>

      {/* Histórico */}
      <Text style={s.sectionLabel}>histórico</Text>

      {history.length === 0 ? (
        <Text style={s.emptyHist}>Nenhum registro ainda</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 6, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={s.histRow}>
              <Text style={s.histDate}>{item.label}</Text>
              <Text style={s.histWeight}>{item.weight} kg</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

export default DetailScreen;