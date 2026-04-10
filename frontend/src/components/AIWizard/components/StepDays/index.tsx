import { DAYS_LABEL, DAYS_SHORT } from "@/src/constants/categories";
import { useTheme } from "@/src/contexts/ThemeContext";
import { Text, TouchableOpacity, View } from "react-native";
import { StepDaysProps } from "./types";

export const StepDays = (props: StepDaysProps) => {
    const { value, onChange } = props;
    const { t } = useTheme();
    const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";

    const toggleDay = (dayIndex: number) => {
        const isSelected = value.includes(dayIndex);

        if (isSelected) {
            onChange(value.filter((currentDay) => currentDay !== dayIndex));
            return;
        }

        onChange([...value, dayIndex].sort((a, b) => a - b));
    };

    return (
        <View>
            <Text
                style={{
                    color: t.textMuted,
                    fontSize: 13,
                    lineHeight: 19,
                    marginBottom: 16,
                }}
            >
                Marque exatamente os dias em que você quer ir para a academia. A IA vai usar
                isso para montar a divisão com mais precisão.
            </Text>

            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                {DAYS_LABEL.map((label, dayIndex) => {
                    const active = value.includes(dayIndex);

                    return (
                        <TouchableOpacity
                            key={label}
                            onPress={() => toggleDay(dayIndex)}
                            activeOpacity={0.7}
                            style={{
                                width: "30%",
                                minWidth: 92,
                                paddingVertical: 14,
                                paddingHorizontal: 12,
                                borderRadius: 16,
                                backgroundColor: active ? t.accent : t.inputBg,
                                borderWidth: 0.5,
                                borderColor: active ? t.accent : t.border,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 11,
                                    fontWeight: "800",
                                    textTransform: "uppercase",
                                    letterSpacing: 1.2,
                                    color: active ? btnColor : t.textDim,
                                }}
                            >
                                {DAYS_SHORT[dayIndex]}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontWeight: "800",
                                    marginTop: 6,
                                    color: active ? btnColor : t.textMuted,
                                }}
                            >
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <Text
                style={{
                    color: t.textDim,
                    fontSize: 12,
                    marginTop: 14,
                    lineHeight: 18,
                }}
            >
                {value.length === 0
                    ? "Selecione pelo menos um dia."
                    : `${value.length} dia${value.length > 1 ? "s" : ""} selecionado${value.length > 1 ? "s" : ""}.`}
            </Text>
        </View>
    );
};
