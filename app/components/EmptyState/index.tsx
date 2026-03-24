import { Text, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { EmptyStateProps } from "./types";

export const EmptyState = (props: EmptyStateProps) => {
  const { icon, message, hint } = props;

  const fade = useRef(new Animated.Value(0)).current;
  const { t } = useTheme();

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 10, opacity: fade }}>
      <Ionicons name={icon as any} size={52} color={t.textDim} />
      <Text style={{ color: t.textMuted, fontSize: 17, fontWeight: "700" }}>{message}</Text>
      <Text style={{ color: t.textDim, fontSize: 13, fontWeight: "500" }}>{hint}</Text>
    </Animated.View>
  );
}