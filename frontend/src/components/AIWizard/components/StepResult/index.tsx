import { useTheme } from "@/src/contexts/ThemeContext";
import { DAYS_LABEL } from "@/src/constants/categories";
import { Text, View } from "react-native";
import { StepResultProps } from "./types";

export const StepResult = (props: StepResultProps) => {
    const { data } = props;
    const { t } = useTheme();

    const selectedDaysLabel =
        data.selectedDays.length > 0
            ? data.selectedDays.map((dayIndex) => DAYS_LABEL[dayIndex]).join(", ")
            : "-";

    const summaryItems = [
        { label: "Altura", value: `${data.height} cm` },
        { label: "Peso", value: `${data.weight} kg` },
        { label: "Dias escolhidos", value: selectedDaysLabel },
        { label: "Total de dias", value: String(data.selectedDays.length) },
        {
            label: "Horas por dia",
            value: data.hoursPerDay.trim() || "Nao informado",
        },
        {
            label: "Maquinas por dia",
            value: data.machinesPerDay.trim() || "Nao informado",
        },
        {
            label: "Modelo de divisao",
            value: data.workoutSplit.trim() || "Nenhum modelo especifico",
        },
        { label: "Intensidade", value: data.intensity ?? "-" },
        { label: "Objetivo", value: data.goal ?? "-" },
        {
            label: "Instrucoes personalizadas",
            value: data.customInstructions.trim() || "Nenhuma observacao adicional.",
        },
    ];

    return (
        <View>
            <Text
                style={{
                    color: t.textDim,
                    fontSize: 11,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 8,
                }}
            >
                resumo da geracao
            </Text>
            <View
                style={{
                    backgroundColor: t.inputBg,
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 0.5,
                    borderColor: t.border,
                }}
            >
                {summaryItems.map((item) => (
                    <View key={item.label} style={{ marginBottom: 12 }}>
                        <Text
                            style={{
                                color: t.textDim,
                                fontSize: 11,
                                fontWeight: "700",
                                textTransform: "uppercase",
                                letterSpacing: 1,
                                marginBottom: 4,
                            }}
                        >
                            {item.label}
                        </Text>
                        <Text style={{ color: t.textPrimary, fontSize: 14, lineHeight: 20 }}>
                            {item.value}
                        </Text>
                    </View>
                ))}
                <Text style={{ color: t.textMuted, fontSize: 12, lineHeight: 18 }}>
                    O prompt final agora eh montado somente no backend antes de chamar a IA.
                </Text>
            </View>
        </View>
    );
};
