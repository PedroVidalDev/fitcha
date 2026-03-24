import { Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { DayPickerProps } from "./types";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function DayPicker(props: DayPickerProps) {
    const { selected, onChange } = props;

    const { t } = useTheme();

    const toggle = (index: number) => {
        if (selected.includes(index)) {
        onChange(selected.filter((d) => d !== index));
        } else {
        onChange([...selected, index].sort());
        }
    };

    return (
        <View style={{ flexDirection: "row", gap: 6, marginTop: 14 }}>
        {DAYS.map((label, i) => {
            const active = selected.includes(i);
            return (
            <TouchableOpacity
                key={i}
                onPress={() => toggle(i)}
                activeOpacity={0.7}
                style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: "center",
                backgroundColor: active ? t.accent : t.inputBg,
                borderWidth: 0.5,
                borderColor: active ? t.accent : t.border,
                }}
            >
                <Text style={{
                fontSize: 11,
                fontWeight: "800",
                color: active
                    ? (t.mode === "dark" ? "#0d0500" : "#FFF")
                    : t.textDim,
                }}>
                {label}
                </Text>
            </TouchableOpacity>
            );
        })}
        </View>
    );
}