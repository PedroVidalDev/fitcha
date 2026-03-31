import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppModal } from "../AppModal";
import { MACHINE_CATEGORIES, MachineCategoryKey } from "../../constants/categories";
import { useTheme } from "../../contexts/ThemeContext";
import { AddMachineModalProps } from "./types";

export function AddMachineModal(props: AddMachineModalProps) {
    const { visible, onClose, onAdd } = props;

    const { t } = useTheme();

    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [catKey, setCatKey] = useState<MachineCategoryKey>("peito");

    const handleAdd = () => {
        if (!name.trim()) return;
        onAdd(name.trim(), catKey, desc.trim() || undefined);
        setName("");
        setDesc("");
        setCatKey("peito");
    };

    const handleClose = () => {
        setName("");
        setDesc("");
        setCatKey("peito");
        onClose();
    };

    const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";

    return (
        <AppModal
            visible={visible}
            onClose={handleClose}
            contentStyle={{ maxHeight: "85%", padding: 24 }}
        >
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <Text
                    style={{
                        color: t.accent,
                        fontSize: 20,
                        fontWeight: "800",
                        marginBottom: 18,
                    }}
                >
                    Nova MÃ¡quina
                </Text>

                <Text
                    style={{
                        color: t.textDim,
                        fontSize: 11,
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        marginBottom: 6,
                    }}
                >
                    nome
                </Text>
                <TextInput
                    style={{
                        backgroundColor: t.inputBg,
                        borderRadius: 12,
                        padding: 14,
                        color: t.textPrimary,
                        fontSize: 16,
                        borderWidth: 0.5,
                        borderColor: t.border,
                        marginBottom: 14,
                    }}
                    placeholder="Ex: Supino Reto"
                    placeholderTextColor={t.textDim}
                    value={name}
                    onChangeText={setName}
                    autoFocus
                />

                <Text
                    style={{
                        color: t.textDim,
                        fontSize: 11,
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        marginBottom: 6,
                    }}
                >
                    descriÃ§Ã£o (opcional)
                </Text>
                <TextInput
                    style={{
                        backgroundColor: t.inputBg,
                        borderRadius: 12,
                        padding: 14,
                        color: t.textPrimary,
                        fontSize: 14,
                        borderWidth: 0.5,
                        borderColor: t.border,
                        marginBottom: 14,
                        minHeight: 60,
                        textAlignVertical: "top",
                    }}
                    placeholder="Detalhes sobre o exercÃ­cio..."
                    placeholderTextColor={t.textDim}
                    value={desc}
                    onChangeText={setDesc}
                    multiline
                />

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
                    categoria
                </Text>
                <View
                    style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 8,
                        marginBottom: 8,
                    }}
                >
                    {MACHINE_CATEGORIES.map((cat) => {
                        const active = catKey === cat.key;
                        return (
                            <TouchableOpacity
                                key={cat.key}
                                onPress={() => setCatKey(cat.key)}
                                activeOpacity={0.7}
                                style={{
                                    paddingHorizontal: 14,
                                    paddingVertical: 8,
                                    borderRadius: 10,
                                    backgroundColor: active ? cat.color : t.inputBg,
                                    borderWidth: 0.5,
                                    borderColor: active ? cat.color : t.border,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: "700",
                                        color: active ? "#FFF" : t.textMuted,
                                    }}
                                >
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    gap: 12,
                    marginTop: 18,
                }}
            >
                <TouchableOpacity onPress={handleClose} style={{ padding: 12 }}>
                    <Text style={{ color: t.textMuted, fontSize: 15, fontWeight: "600" }}>
                        Cancelar
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAdd} activeOpacity={0.75}>
                    <LinearGradient
                        colors={t.gradientAccent}
                        style={{
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            borderRadius: 12,
                        }}
                    >
                        <Text style={{ color: btnColor, fontSize: 15, fontWeight: "800" }}>
                            Adicionar
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </AppModal>
    );
}
