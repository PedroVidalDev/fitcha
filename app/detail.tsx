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

  const { currentSets, history, addEntry } = useMachineDetail(
    categoryId,
    machineId
  );
  const [set1, setSet1] = useState("");
  const [set2, setSet2] = useState("");
  const [set3, setSet3] = useState("");

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
  }, [currentSets]);

  const parseWeight = (v: string) => parseFloat(v.replace(",", "."));

  const handleSave = () => {
    const s1 = parseWeight(set1);
    const s2 = parseWeight(set2);
    const s3 = parseWeight(set3);
    if ([s1, s2, s3].some((v) => isNaN(v) || v <= 0)) return;

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

    addEntry([s1, s2, s3]);
    setSet1("");
    setSet2("");
    setSet3("");
  };

  const maxWeight = currentSets ? Math.max(...currentSets) : null;
  const prevMax =
    history.length >= 2 ? Math.max(...history[1].sets) : undefined;

  return (
    <View style={s.container}>
      <Stack.Screen options={{ title: machineName ?? "Detalhe" }} />

      {/* Hero: Séries atuais */}
      <LinearGradient
        colors={["#2a1508", "#1a0a00", "#0d0500"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.heroBlock}
      >
        <Text style={s.heroLabel}>séries atuais</Text>

        {currentSets ? (
          <RNAnimated.View
            style={{
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
              alignItems: "center",
            }}
          >
            {/* 3 chips de série */}
            <View style={s.setsRow}>
              {currentSets.map((w, i) => (
                <View key={i} style={s.setChip}>
                  <Text style={s.setChipLabel}>S{i + 1}</Text>
                  <Text style={s.setChipValue}>{w}</Text>
                  <Text style={s.setChipUnit}>kg</Text>
                </View>
              ))}
            </View>
            {/* Maior carga */}
            <Text style={s.heroMax}>
              máx <Text style={s.heroMaxValue}>{maxWeight} kg</Text>
            </Text>
          </RNAnimated.View>
        ) : (
          <Text style={s.heroPlaceholder}>—</Text>
        )}

        {maxWeight != null && prevMax != null && (
          <WeightDelta current={maxWeight} previous={prevMax} />
        )}
      </LinearGradient>

      {/* Inputs das 3 séries */}
      <Text style={s.sectionLabel}>registrar treino</Text>
      <View style={s.setsInputRow}>
        {[
          { label: "Série 1", value: set1, setter: setSet1 },
          { label: "Série 2", value: set2, setter: setSet2 },
          { label: "Série 3", value: set3, setter: setSet3 },
        ].map((item, i) => (
          <View key={i} style={s.setInputWrap}>
            <Text style={s.setInputLabel}>{item.label}</Text>
            <TextInput
              style={s.setInput}
              placeholder="kg"
              placeholderTextColor="#5a2a0a"
              keyboardType="numeric"
              value={item.value}
              onChangeText={item.setter}
            />
          </View>
        ))}
      </View>
      <TouchableOpacity activeOpacity={0.75} onPress={handleSave}>
        <LinearGradient
          colors={["#F4A261", "#E07A2F"]}
          style={s.saveBtnFull}
        >
          <Ionicons name="checkmark-circle" size={20} color="#0d0500" />
          <Text style={s.saveBtnText}>Salvar</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Histórico */}
      <Text style={[s.sectionLabel, { marginTop: 24 }]}>histórico</Text>

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
                <View style={s.histSets}>
                  {item.sets.map((w, i) => (
                    <Text key={i} style={s.histSetValue}>
                      {w}<Text style={s.histSetUnit}>kg</Text>
                    </Text>
                  ))}
                </View>
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