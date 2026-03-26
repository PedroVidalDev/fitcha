import { useTheme } from "@/src/contexts/ThemeContext";
import { Platform, Text, View } from "react-native";
import { buildExpectedJSON, buildGPTPrompt } from "../../prompt";
import { StepResultProps } from "./types";

export const StepResult = (props: StepResultProps) => {
    const { data } = props;

    const { t } = useTheme();
    const prompt = buildGPTPrompt(data);
    const expectedJSON = buildExpectedJSON();

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
                mensagem que será enviada
            </Text>
            <View
                style={{
                    backgroundColor: t.inputBg,
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 0.5,
                    borderColor: t.border,
                    marginBottom: 16,
                }}
            >
                <Text style={{ color: t.textPrimary, fontSize: 13, lineHeight: 20 }}>{prompt}</Text>
            </View>

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
                json esperado de resposta
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
                <Text
                    style={{
                        color: t.textMuted,
                        fontSize: 11,
                        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                        lineHeight: 18,
                    }}
                >
                    {expectedJSON}
                </Text>
            </View>
        </View>
    );
}
