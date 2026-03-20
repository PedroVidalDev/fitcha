import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useEffect } from "react";

type Props = { icon: string; message: string; hint: string };

export function EmptyState({ icon, message, hint }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[es.container, { opacity: fadeAnim }]}>
      <Ionicons name={icon as any} size={52} color="#3a1a08" />
      <Text style={es.message}>{message}</Text>
      <Text style={es.hint}>{hint}</Text>
    </Animated.View>
  );
}

const es = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  message: { color: "#8B4513", fontSize: 17, fontWeight: "700" },
  hint: { color: "#5a2a0a", fontSize: 13, fontWeight: "500" },
});