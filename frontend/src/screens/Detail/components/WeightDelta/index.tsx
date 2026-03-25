import { useTheme } from "@/src/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export const WeightDelta = ({ current, previous }: { current: number; previous?: number }) => {
    const { t } = useTheme();

    if (!previous) return null;
    const diff = current - previous;
    if (diff === 0) return null;
    const isUp = diff > 0;
    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 8,
                backgroundColor: t.chipBg,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
            }}
        >
            <Ionicons
                name={isUp ? "arrow-up" : "arrow-down"}
                size={14}
                color={isUp ? "#4CAF50" : "#EF5350"}
            />
            <Text style={{ fontSize: 13, fontWeight: "700", color: isUp ? "#4CAF50" : "#EF5350" }}>
                {isUp ? "+" : ""}
                {diff.toFixed(1)} kg
            </Text>
        </View>
    );
};
