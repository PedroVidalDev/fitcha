import { useTheme } from "@/src/contexts/ThemeContext";
import { useI18n } from "@/src/contexts/I18nContext";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { StepGoalProps } from "./types";

export const StepGoal = (props: StepGoalProps) => {
    const { value, onChange } = props;

    const { t } = useTheme();
    const { t: translate } = useI18n();
    const options: {
        key: "hipertrofia" | "forca" | "resistencia" | "emagrecimento";
        icon: string;
        titleKey:
            | "aiWizard.goal.hypertrophy.title"
            | "aiWizard.goal.strength.title"
            | "aiWizard.goal.endurance.title"
            | "aiWizard.goal.weightLoss.title";
        descKey:
            | "aiWizard.goal.hypertrophy.description"
            | "aiWizard.goal.strength.description"
            | "aiWizard.goal.endurance.description"
            | "aiWizard.goal.weightLoss.description";
    }[] = [
        {
            key: "hipertrofia",
            icon: "body-outline",
            titleKey: "aiWizard.goal.hypertrophy.title",
            descKey: "aiWizard.goal.hypertrophy.description",
        },
        {
            key: "forca",
            icon: "barbell-outline",
            titleKey: "aiWizard.goal.strength.title",
            descKey: "aiWizard.goal.strength.description",
        },
        {
            key: "resistencia",
            icon: "heart-outline",
            titleKey: "aiWizard.goal.endurance.title",
            descKey: "aiWizard.goal.endurance.description",
        },
        {
            key: "emagrecimento",
            icon: "trending-down-outline",
            titleKey: "aiWizard.goal.weightLoss.title",
            descKey: "aiWizard.goal.weightLoss.description",
        },
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
                                {translate(opt.titleKey)}
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
                                {translate(opt.descKey)}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};
