import { useTheme } from "@/src/contexts/ThemeContext";
import { getDayLabelKey } from "@/src/constants/categories";
import { useI18n } from "@/src/contexts/I18nContext";
import { Text, View } from "react-native";
import { StepResultProps } from "./types";

export const StepResult = (props: StepResultProps) => {
    const { data } = props;
    const { t } = useTheme();
    const { t: translate } = useI18n();

    const intensityLabelMap = {
        leve: translate("aiWizard.intensity.light.title"),
        moderado: translate("aiWizard.intensity.moderate.title"),
        intenso: translate("aiWizard.intensity.intense.title"),
    } as const;

    const goalLabelMap = {
        hipertrofia: translate("aiWizard.goal.hypertrophy.title"),
        forca: translate("aiWizard.goal.strength.title"),
        resistencia: translate("aiWizard.goal.endurance.title"),
        emagrecimento: translate("aiWizard.goal.weightLoss.title"),
    } as const;

    const selectedDaysLabel =
        data.selectedDays.length > 0
            ? data.selectedDays.map((dayIndex) => translate(getDayLabelKey(dayIndex))).join(", ")
            : "-";

    const summaryItems = [
        {
            label: translate("aiWizard.review.height"),
            value: `${data.height} ${translate("common.units.cm")}`,
        },
        {
            label: translate("aiWizard.review.weight"),
            value: `${data.weight} ${translate("common.units.kg")}`,
        },
        { label: translate("aiWizard.review.selectedDays"), value: selectedDaysLabel },
        { label: translate("aiWizard.review.totalDays"), value: String(data.selectedDays.length) },
        {
            label: translate("aiWizard.review.hoursPerDay"),
            value: data.hoursPerDay.trim() || translate("aiWizard.review.notInformed"),
        },
        {
            label: translate("aiWizard.review.machinesPerDay"),
            value: data.machinesPerDay.trim() || translate("aiWizard.review.notInformed"),
        },
        {
            label: translate("aiWizard.review.split"),
            value: data.workoutSplit.trim() || translate("aiWizard.review.noSpecificSplit"),
        },
        {
            label: translate("aiWizard.review.intensity"),
            value: data.intensity ? intensityLabelMap[data.intensity] : "-",
        },
        {
            label: translate("aiWizard.review.goal"),
            value: data.goal ? goalLabelMap[data.goal] : "-",
        },
        {
            label: translate("aiWizard.review.instructions"),
            value: data.customInstructions.trim() || translate("aiWizard.review.noAdditionalNotes"),
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
                {translate("aiWizard.review.title")}
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
                    {translate("aiWizard.review.promptNote")}
                </Text>
            </View>
        </View>
    );
};
