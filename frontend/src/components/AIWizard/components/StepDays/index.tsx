import { useTheme } from "@/src/contexts/ThemeContext";
import { Text, TouchableOpacity, View } from "react-native";
import { StepDaysProps } from "./types";

export const StepDays = (props: StepDaysProps) => {
    const { value, onChange } = props;

    const { t } = useTheme();
    const options = [2, 3, 4, 5, 6];

    return (
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {options.map((n) => {
                const active = value === n;
                return (
                    <TouchableOpacity
                        key={n}
                        onPress={() => onChange(n)}
                        activeOpacity={0.7}
                        style={{
                            paddingVertical: 16,
                            paddingHorizontal: 22,
                            borderRadius: 14,
                            backgroundColor: active ? t.accent : t.inputBg,
                            borderWidth: 0.5,
                            borderColor: active ? t.accent : t.border,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: "900",
                                color: active
                                    ? t.mode === "dark"
                                        ? "#0d0500"
                                        : "#FFF"
                                    : t.textMuted,
                            }}
                        >
                            {n}x
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
