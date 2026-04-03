import { LinearGradient } from "expo-linear-gradient";
import { Text, TouchableOpacity, View } from "react-native";
import { AppModal } from "../AppModal";
import { useTheme } from "../../contexts/ThemeContext";
import { ConfirmModalProps } from "./types";

export const ConfirmModal = (props: ConfirmModalProps) => {
    const {
        visible,
        title,
        message,
        confirmLabel = "Confirmar",
        cancelLabel = "Cancelar",
        hideCancel = false,
        confirmVariant = "danger",
        onClose,
        onConfirm,
    } = props;

    const { t } = useTheme();
    const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";

    return (
        <AppModal visible={visible} onClose={onClose} contentStyle={{ padding: 24 }} overlayPadding={24}>
            <Text
                style={{
                    color: t.accent,
                    fontSize: 20,
                    fontWeight: "800",
                    marginBottom: 10,
                }}
            >
                {title}
            </Text>
            <Text
                style={{
                    color: t.textMuted,
                    fontSize: 14,
                    lineHeight: 20,
                    marginBottom: 22,
                }}
            >
                {message}
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12 }}>
                {!hideCancel && (
                    <TouchableOpacity onPress={onClose} style={{ padding: 12, justifyContent: "center" }}>
                        <Text
                            style={{
                                color: t.textMuted,
                                fontSize: 15,
                                fontWeight: "600",
                            }}
                        >
                            {cancelLabel}
                        </Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={onConfirm} activeOpacity={0.75}>
                    {confirmVariant === "accent" ? (
                        <LinearGradient
                            colors={t.gradientAccent}
                            style={{
                                paddingHorizontal: 24,
                                paddingVertical: 12,
                                borderRadius: 12,
                            }}
                        >
                            <Text
                                style={{
                                    color: btnColor,
                                    fontSize: 15,
                                    fontWeight: "800",
                                }}
                            >
                                {confirmLabel}
                            </Text>
                        </LinearGradient>
                    ) : (
                        <View
                            style={{
                                backgroundColor: "#EF5350",
                                paddingHorizontal: 24,
                                paddingVertical: 12,
                                borderRadius: 12,
                            }}
                        >
                            <Text
                                style={{
                                    color: "#FFF",
                                    fontSize: 15,
                                    fontWeight: "800",
                                }}
                            >
                                {confirmLabel}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </AppModal>
    );
};
