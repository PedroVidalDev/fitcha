import { useTheme } from "@/src/contexts/ThemeContext";
import { Text, TextInput, View } from "react-native";
import { StepInstructionsProps } from "./types";

export const StepInstructions = (props: StepInstructionsProps) => {
    const { value, onChange } = props;
    const { t } = useTheme();

    return (
        <View>
            <Text
                style={{
                    color: t.textDim,
                    fontSize: 13,
                    lineHeight: 20,
                    marginBottom: 12,
                }}
            >
                Adicione observacoes para a IA, como lesoes, exercicios que voce prefere evitar,
                foco em algum grupo muscular ou equipamentos que a academia tem.
            </Text>

            <View
                style={{
                    backgroundColor: t.inputBg,
                    borderRadius: 14,
                    borderWidth: 0.5,
                    borderColor: t.border,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                }}
            >
                <TextInput
                    style={{
                        minHeight: 120,
                        color: t.textPrimary,
                        fontSize: 15,
                        lineHeight: 22,
                        textAlignVertical: "top",
                    }}
                    placeholder="Ex: evitar agachamento livre por dor no joelho e priorizar maquinas."
                    placeholderTextColor={t.textDim}
                    multiline
                    value={value}
                    onChangeText={onChange}
                />
            </View>
        </View>
    );
};
