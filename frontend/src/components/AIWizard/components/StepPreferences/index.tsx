import { useTheme } from "@/src/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Text, TextInput, View } from "react-native";
import { StepPreferencesProps } from "./types";

export const StepPreferences = (props: StepPreferencesProps) => {
    const {
        hoursPerDay,
        machinesPerDay,
        workoutSplit,
        onHoursPerDayChange,
        onMachinesPerDayChange,
        onWorkoutSplitChange,
    } = props;

    const { t } = useTheme();

    return (
        <View style={{ gap: 16 }}>
            <Text
                style={{
                    color: t.textDim,
                    fontSize: 13,
                    lineHeight: 20,
                }}
            >
                Esses campos sao opcionais. Preencha se quiser que a IA respeite um limite de
                tempo, volume diario ou um modelo de divisao especifico.
            </Text>

            <View>
                <Text
                    style={{ color: t.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 8 }}
                >
                    Horas por dia
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
                    <Ionicons name="time-outline" size={18} color={t.textDim} />
                    <TextInput
                        style={{
                            flex: 1,
                            padding: 16,
                            color: t.textPrimary,
                            fontSize: 18,
                            fontWeight: "700",
                        }}
                        placeholder="Ex: 1, 1.5 ou 2"
                        placeholderTextColor={t.textDim}
                        keyboardType="decimal-pad"
                        value={hoursPerDay}
                        onChangeText={onHoursPerDayChange}
                    />
                </View>
            </View>

            <View>
                <Text
                    style={{ color: t.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 8 }}
                >
                    Maquinas por dia
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
                    <Ionicons name="barbell-outline" size={18} color={t.textDim} />
                    <TextInput
                        style={{
                            flex: 1,
                            padding: 16,
                            color: t.textPrimary,
                            fontSize: 18,
                            fontWeight: "700",
                        }}
                        placeholder="Ex: 6"
                        placeholderTextColor={t.textDim}
                        keyboardType="numeric"
                        value={machinesPerDay}
                        onChangeText={onMachinesPerDayChange}
                    />
                </View>
            </View>

            <View>
                <Text
                    style={{ color: t.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 8 }}
                >
                    Modelo de divisao
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
                    <Ionicons name="git-network-outline" size={18} color={t.textDim} />
                    <TextInput
                        style={{
                            flex: 1,
                            padding: 16,
                            color: t.textPrimary,
                            fontSize: 18,
                            fontWeight: "700",
                        }}
                        placeholder="Ex: ABC, ABCAB, fullbody"
                        placeholderTextColor={t.textDim}
                        autoCapitalize="none"
                        value={workoutSplit}
                        onChangeText={onWorkoutSplitChange}
                    />
                </View>
            </View>
        </View>
    );
};
