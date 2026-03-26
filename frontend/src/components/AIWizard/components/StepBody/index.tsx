import { useTheme } from "@/src/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Text, TextInput, View } from "react-native";
import { StepBodyProps } from "./types";

export const StepBody = (props: StepBodyProps) => {
    const { height, weight, onHeightChange, onWeightChange } = props;

    const { t } = useTheme();

    return (
        <View style={{ gap: 16 }}>
            <View>
                <Text
                    style={{ color: t.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 8 }}
                >
                    Altura (cm)
                </Text>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        backgroundColor: t.inputBg,
                        borderRadius: 14,
                        paddingHorizontal: 16,
                        borderWidth: 0.5,
                        borderColor: t.border,
                    }}
                >
                    <Ionicons name="resize-outline" size={18} color={t.textDim} />
                    <TextInput
                        style={{
                            flex: 1,
                            padding: 16,
                            color: t.textPrimary,
                            fontSize: 20,
                            fontWeight: "800",
                        }}
                        placeholder="175"
                        placeholderTextColor={t.textDim}
                        keyboardType="numeric"
                        value={height}
                        onChangeText={onHeightChange}
                    />
                    <Text style={{ color: t.textMuted, fontSize: 14, fontWeight: "600" }}>cm</Text>
                </View>
            </View>

            <View>
                <Text
                    style={{ color: t.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 8 }}
                >
                    Peso (kg)
                </Text>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        backgroundColor: t.inputBg,
                        borderRadius: 14,
                        paddingHorizontal: 16,
                        borderWidth: 0.5,
                        borderColor: t.border,
                    }}
                >
                    <Ionicons name="scale-outline" size={18} color={t.textDim} />
                    <TextInput
                        style={{
                            flex: 1,
                            padding: 16,
                            color: t.textPrimary,
                            fontSize: 20,
                            fontWeight: "800",
                        }}
                        placeholder="75"
                        placeholderTextColor={t.textDim}
                        keyboardType="numeric"
                        value={weight}
                        onChangeText={onWeightChange}
                    />
                    <Text style={{ color: t.textMuted, fontSize: 14, fontWeight: "600" }}>kg</Text>
                </View>
            </View>

            <Text style={{ color: t.textDim, fontSize: 12, textAlign: "center", marginTop: 4 }}>
                Esses dados ajudam a calibrar os pesos sugeridos
            </Text>
        </View>
    );
}
