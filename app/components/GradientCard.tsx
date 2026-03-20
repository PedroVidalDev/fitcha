import { TouchableOpacity, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
};

export function GradientCard({ children, onPress }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={gc.shadow}
    >
      <LinearGradient
        colors={["#231005", "#180b02"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={gc.gradient}
      >
        {children}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const gc = StyleSheet.create({
  shadow: {
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#F4A261",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 0.5,
    borderColor: "rgba(244, 162, 97, 0.12)",
  },
});