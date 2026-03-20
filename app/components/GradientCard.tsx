import { TouchableOpacity, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../contexts/ThemeContext";

type Props = { children: React.ReactNode; onPress?: () => void };

export function GradientCard({ children, onPress }: Props) {
  const { t } = useTheme();
  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress}
      style={{
        borderRadius: 16,
        ...Platform.select({
          ios: { shadowColor: t.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
          android: { elevation: 6 },
        }),
      }}
    >
      <LinearGradient colors={t.gradientCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{
          flexDirection: "row", alignItems: "center", borderRadius: 16,
          padding: 16, gap: 14, borderWidth: 0.5, borderColor: t.border,
        }}
      >
        {children}
      </LinearGradient>
    </TouchableOpacity>
  );
}
