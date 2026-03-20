import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = { icon: string; message: string; hint: string };

export function EmptyState({ icon, message, hint }: Props) {
  return (
    <View style={es.container}>
      <Ionicons name={icon as any} size={48} color="#7A2E00" />
      <Text style={es.message}>{message}</Text>
      <Text style={es.hint}>{hint}</Text>
    </View>
  );
}

const es = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8, opacity: 0.7 },
  message: { color: "#F4A261", fontSize: 16, fontWeight: "600" },
  hint: { color: "#7A2E00", fontSize: 13 },
});