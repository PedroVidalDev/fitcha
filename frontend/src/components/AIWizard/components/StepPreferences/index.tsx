import { useTheme } from "@/src/contexts/ThemeContext";
import { useI18n } from "@/src/contexts/I18nContext";
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
    const { t: translate } = useI18n();

    return (
        <View style={{ gap: 16 }}>
            <Text
                style={{
                    color: t.textDim,
                    fontSize: 13,
                    lineHeight: 20,
                }}
            >
                {translate("aiWizard.preferences.description")}
            </Text>

            <View>
                <Text
                    style={{ color: t.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 8 }}
                >
                    {translate("aiWizard.preferences.hoursLabel")}
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
                        placeholder={translate("aiWizard.preferences.hoursPlaceholder")}
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
                    {translate("aiWizard.preferences.machinesLabel")}
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
                        placeholder={translate("aiWizard.preferences.machinesPlaceholder")}
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
                    {translate("aiWizard.preferences.splitLabel")}
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
                        placeholder={translate("aiWizard.preferences.splitPlaceholder")}
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
