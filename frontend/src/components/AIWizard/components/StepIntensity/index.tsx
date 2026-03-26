import { useTheme } from "@/src/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { StepIntensityProps } from "./types";

export const StepIntensity = (props: StepIntensityProps) => {
    const { value, onChange } = props;

    const { t } = useTheme();
    const options: { key: "leve" | "moderado" | "intenso"; icon: string; desc: string }[] = [
        { key: "leve", icon: "leaf-outline", desc: "Iniciante ou retorno" },
        { key: "moderado", icon: "flame-outline", desc: "Treino consistente" },
        { key: "intenso", icon: "flash-outline", desc: "Alto volume e carga" },
    ];

    return (
        <View style={{ gap: 10 }}>
            {options.map((opt) => {
                const active = value === opt.key;
                return (
                    <TouchableOpacity
                        key={opt.key}
                        onPress={() => onChange(opt.key)}
                        activeOpacity={0.7}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 14,
                            padding: 16,
                            borderRadius: 14,
                            backgroundColor: active ? t.accent : t.inputBg,
                            borderWidth: 0.5,
                            borderColor: active ? t.accent : t.border,
                        }}
                    >
                        <Ionicons
                            name={opt.icon as any}
                            size={22}
                            color={active ? (t.mode === "dark" ? "#0d0500" : "#FFF") : t.textMuted}
                        />
                        <View>
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontWeight: "800",
                                    textTransform: "capitalize",
                                    color: active
                                        ? t.mode === "dark"
                                            ? "#0d0500"
                                            : "#FFF"
                                        : t.textPrimary,
                                }}
                            >
                                {opt.key}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 12,
                                    marginTop: 2,
                                    color: active
                                        ? t.mode === "dark"
                                            ? "rgba(13,5,0,0.6)"
                                            : "rgba(255,255,255,0.7)"
                                        : t.textMuted,
                                }}
                            >
                                {opt.desc}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
