import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Animated as RNAnimated,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useMachineDetail } from "./hooks/useStorage";
import { useState, useRef, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { AnimatedCard } from "./components/AnimatedCard";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./contexts/ThemeContext";

function WeightDelta({ current, previous }: { current: number; previous?: number }) {
  const { t } = useTheme();
  if (!previous) return null;
  const diff = current - previous;
  if (diff === 0) return null;
  const isUp = diff > 0

  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8,
      backgroundColor: t.chipBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    }}>
      <Ionicons name={isUp ? "arrow-up" : "arrow-down"} size={14} color={isUp ? "#4CAF50" : "#EF5350"} />
      <Text style={{ fontSize: 13, fontWeight: "700", color: isUp ? "#4CAF50" : "#EF5350" }}>
        {isUp ? "+" : ""}{diff.toFixed(1)} kg
      </Text>
    </View>
  );
}

export default function DetailScreen() {
  const { categoryId, machineId, machineName } = useLocalSearchParams<{
    categoryId: string; machineId: string; machineName: string;
  }>();
  const { currentSets, history, addEntry } = useMachineDetail(categoryId, machineId);
  const [set1, setSet1] = useState("");
  const [set2, setSet2] = useState("");
  const [set3, setSet3] = useState("");
  const { t } = useTheme();

  const scaleAnim = useRef(new RNAnimated.Value(0.8)).current;
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      RNAnimated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [currentSets]);

  const parseW = (v: string) => parseFloat(v.replace(",", "."));

  const handleSave = () => {
    const s1 = parseW(set1), s2 = parseW(set2), s3 = parseW(set3);
    if ([s1, s2, s3].some((v) => isNaN(v) || v <= 0)) return;

    RNAnimated.sequence([
      RNAnimated.spring(scaleAnim, { toValue: 1.1, tension: 100, friction: 5, useNativeDriver: true }),
      RNAnimated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    addEntry([s1, s2, s3]);
    setSet1(""); setSet2(""); setSet3("");
  };

  const maxW = currentSets ? Math.max(...currentSets) : null;
  const prevMax = history.length >= 2 ? Math.max(...history[1].sets) : undefined;

  const labelStyle = {
    color: t.textDim, fontSize: 11, fontWeight: "700" as const,
    textTransform: "uppercase" as const, letterSpacing: 2,
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, padding: 16 }}>
      <Stack.Screen options={{ title: machineName ?? "Detalhe" }} />

      {/* Hero */}
      <LinearGradient colors={t.gradientHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{
          alignItems: "center", paddingVertical: 32, borderRadius: 20, marginBottom: 20,
          borderWidth: 0.5, borderColor: t.border,
        }}
      >
        <Text style={labelStyle}>séries atuais</Text>

        {currentSets ? (
          <RNAnimated.View style={{ transform: [{ scale: scaleAnim }], opacity: fadeAnim, alignItems: "center" }}>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              {currentSets.map((w, i) => (
                <View key={i} style={{
                  alignItems: "center", backgroundColor: t.chipBg, borderRadius: 14,
                  paddingVertical: 12, paddingHorizontal: 18, borderWidth: 0.5, borderColor: t.border,
                }}>
                  <Text style={{ color: t.textDim, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>
                    S{i + 1}
                  </Text>
                  <Text style={{ color: t.accent, fontSize: 28, fontWeight: "900", marginTop: 2 }}>{w}</Text>
                  <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: "600", marginTop: 2 }}>kg</Text>
                </View>
              ))}
            </View>
            <Text style={{ color: t.textMuted, fontSize: 13, fontWeight: "600", marginTop: 12 }}>
              máx <Text style={{ color: t.accent, fontWeight: "800", fontSize: 15 }}>{maxW} kg</Text>
            </Text>
          </RNAnimated.View>
        ) : (
          <Text style={{ color: t.textMuted, fontSize: 48, fontWeight: "900", marginTop: 8 }}>—</Text>
        )}

        {maxW != null && prevMax != null && <WeightDelta current={maxW} previous={prevMax} />}
      </LinearGradient>

      {/* Inputs */}
      <Text style={{ ...labelStyle, marginBottom: 10, marginLeft: 2 }}>registrar treino</Text>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
        {[
          { l: "Série 1", v: set1, fn: setSet1 },
          { l: "Série 2", v: set2, fn: setSet2 },
          { l: "Série 3", v: set3, fn: setSet3 },
        ].map((item, i) => (
          <View key={i} style={{ flex: 1 }}>
            <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: "700", marginBottom: 6, marginLeft: 4 }}>
              {item.l}
            </Text>
            <TextInput
              style={{
                backgroundColor: t.inputBg, borderRadius: 12, padding: 14,
                color: t.textPrimary, fontSize: 16, fontWeight: "700", textAlign: "center",
                borderWidth: 0.5, borderColor: t.border,
              }}
              placeholder="kg" placeholderTextColor={t.textDim}
              keyboardType="numeric" value={item.v} onChangeText={item.fn}
            />
          </View>
        ))}
      </View>

      <TouchableOpacity activeOpacity={0.75} onPress={handleSave}>
        <LinearGradient colors={t.gradientAccent}
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "center",
            gap: 8, paddingVertical: 14, borderRadius: 14, marginBottom: 4,
          }}
        >
          <Ionicons name="checkmark-circle" size={20} color={t.mode === "dark" ? "#0d0500" : "#FFF"} />
          <Text style={{ color: t.mode === "dark" ? "#0d0500" : "#FFF", fontSize: 16, fontWeight: "800" }}>
            Salvar
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Histórico */}
      <Text style={{ ...labelStyle, marginTop: 24, marginBottom: 12, marginLeft: 2 }}>histórico</Text>

      {history.length === 0 ? (
        <Text style={{ color: t.textDim, textAlign: "center", marginTop: 24, fontSize: 14, fontWeight: "500" }}>
          Nenhum registro ainda
        </Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 8, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <AnimatedCard index={index}>
              <View style={{
                flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                backgroundColor: t.histBg, borderRadius: 12,
                paddingHorizontal: 16, paddingVertical: 12, borderWidth: 0.5, borderColor: t.border,
              }}>
                <Text style={{ color: t.textMuted, fontSize: 13, fontWeight: "500" }}>{item.label}</Text>
                <View style={{ flexDirection: "row", gap: 14 }}>
                  {item.sets.map((w, i) => (
                    <Text key={i} style={{ color: t.accent, fontSize: 14, fontWeight: "700" }}>
                      {w}<Text style={{ color: t.textMuted, fontSize: 11, fontWeight: "500" }}>kg</Text>
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