import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Animated as RNAnimated,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useMachineDetail } from "./hooks/useStorage";
import { useState, useRef, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { AnimatedCard } from "./components/AnimatedCard";
import { Ionicons } from "@expo/vector-icons";
import { s } from "./styles/theme";

export function DetailScreen() {
  const { categoryId, machineId, machineName } = useLocalSearchParams<{
    categoryId: string;
    machineId: string;
    machineName: string;
  }>();

  const { currentWeight, history, addEntry } = useMachineDetail(
    categoryId,
    machineId
  );
  const [weight, setWeight] = useState("");

  // Animação do peso atual
  const scaleAnim = useRef(new RNAnimated.Value(0.8)).current;
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentWeight]);

  const handleSave = () => {
    const num = parseFloat(weight.replace(",", "."));
    if (isNaN(num) || num <= 0) return;

    // Bounce animation on save
    RNAnimated.sequence([
      RNAnimated.spring(scaleAnim, {
        toValue: 1.1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
      RNAnimated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    addEntry(num);
    setWeight("");
  };

  return (
    <View style={s.container}>
      <Stack.Screen options={{ title: machineName ?? "Detalhe" }} />

      {/* Hero: Peso atual com gradiente */}
      <LinearGradient
        colors={["#2a1508", "#1a0a00", "#0d0500"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.heroBlock}
      >
        <Text style={s.heroLabel}>peso atual</Text>
        <RNAnimated.Text
          style={[
            s.heroWeight,
            { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
          ]}
        >
          {currentWeight ?? "—"}
          {currentWeight != null && <Text style={s.heroUnit}> kg</Text>}
        </RNAnimated.Text>
        {currentWeight != null && history.length >= 2 && (
          <WeightDelta current={currentWeight} previous={history[1]?.weight} />
        )}
      </LinearGradient>

      {/* Input de novo peso */}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Novo peso (kg)"
          placeholderTextColor="#5a2a0a"
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
          onSubmitEditing={handleSave}
        />
        <TouchableOpacity
          style={s.saveBtn}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={["#F4A261", "#E07A2F"]}
            style={s.saveBtnGradient}
          >
            <Ionicons name="checkmark" size={22} color="#0d0500" />
          </LinearGradient>
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
          contentContainerStyle={{ gap: 8, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <AnimatedCard index={index}>
              <View style={s.histRow}>
                <Text style={s.histDate}>{item.label}</Text>
                <Text style={s.histWeight}>{item.weight} kg</Text>
              </View>
            </AnimatedCard>
          )}
        />
      )}
    </View>
  );
}

// Mini componente de delta
function WeightDelta({ current, previous }: { current: number; previous?: number }) {
  if (!previous) return null;
  const diff = current - previous;
  if (diff === 0) return null;

  const isUp = diff > 0;
  return (
    <View style={s.deltaRow}>
      <Ionicons
        name={isUp ? "arrow-up" : "arrow-down"}
        size={14}
        color={isUp ? "#4CAF50" : "#EF5350"}
      />
      <Text style={[s.deltaText, { color: isUp ? "#4CAF50" : "#EF5350" }]}>
        {isUp ? "+" : ""}
        {diff.toFixed(1)} kg
      </Text>
    </View>
  );
}

export default DetailScreen;