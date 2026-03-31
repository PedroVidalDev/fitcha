import { RootStackParamList } from "@/src/router/types";
import { useMachineHistory } from "@/src/screens/Detail/hooks/useMachineHistory";
import { useMachinePhoto } from "@/src/screens/Detail/hooks/useMachinePhoto";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { AnimatedCard } from "../../components/AnimatedCard";
import { AppModal } from "../../components/AppModal";
import { CategoryBadge } from "../../components/CategoryBadge";
import { useTheme } from "../../contexts/ThemeContext";

type Route = RouteProp<RootStackParamList, "MachineDetail">;
type PhotoModalAction = {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    variant?: "default" | "accent" | "danger";
    onPress: () => void;
};

type PhotoModalState = {
    title: string;
    message?: string;
    actions: PhotoModalAction[];
    closeLabel?: string;
    hideCloseButton?: boolean;
};

export default function MachineDetailScreen() {
    const { t } = useTheme();

    const route = useRoute<Route>();
    const navigation = useNavigation();
    const { machineId } = route.params;

    const { machine, history } = useMachineHistory(machineId);
    const { photo, updatePhoto, removePhoto } = useMachinePhoto(machineId);

    const [photoModal, setPhotoModal] = useState<PhotoModalState | null>(null);
    const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";

    const closePhotoModal = () => {
        setPhotoModal(null);
    };

    const openInfoModal = (title: string, message: string) => {
        setPhotoModal({
            title,
            message,
            hideCloseButton: true,
            actions: [
                {
                    label: "Fechar",
                    icon: "checkmark-circle-outline",
                    variant: "accent",
                    onPress: closePhotoModal,
                },
            ],
        });
    };

    const pickFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            openInfoModal(
                "Permissao necessaria",
                "Permita acesso a galeria para selecionar uma foto da maquina.",
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            await updatePhoto(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            openInfoModal(
                "Permissao necessaria",
                "Permita acesso a camera para registrar uma foto da maquina.",
            );
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            await updatePhoto(result.assets[0].uri);
        }
    };

    const openSourceModal = () => {
        setPhotoModal({
            title: photo ? "Trocar foto" : "Adicionar foto",
            message: "Escolha de onde a imagem deve vir.",
            actions: [
                {
                    label: "Usar camera",
                    icon: "camera-outline",
                    variant: "accent",
                    onPress: () => {
                        closePhotoModal();
                        void takePhoto();
                    },
                },
                {
                    label: "Escolher da galeria",
                    icon: "images-outline",
                    onPress: () => {
                        closePhotoModal();
                        void pickFromGallery();
                    },
                },
            ],
        });
    };

    const openRemovePhotoModal = () => {
        setPhotoModal({
            title: "Remover foto?",
            message: "A imagem atual sera removida desta maquina.",
            actions: [
                {
                    label: "Remover foto",
                    icon: "trash-outline",
                    variant: "danger",
                    onPress: () => {
                        closePhotoModal();
                        void removePhoto();
                    },
                },
            ],
        });
    };

    const openPhotoActionsModal = () => {
        if (!photo) {
            openSourceModal();
            return;
        }

        setPhotoModal({
            title: "Foto da maquina",
            message: "Escolha o que deseja fazer com a imagem.",
            actions: [
                {
                    label: "Trocar foto",
                    icon: "swap-horizontal-outline",
                    onPress: openSourceModal,
                },
                {
                    label: "Remover foto",
                    icon: "trash-outline",
                    variant: "danger",
                    onPress: openRemovePhotoModal,
                },
            ],
        });
    };

    const handlePhotoPress = () => {
        openPhotoActionsModal();
    };

    const labelStyle = {
        color: t.textDim,
        fontSize: 11,
        fontWeight: "700" as const,
        textTransform: "uppercase" as const,
        letterSpacing: 2,
    };

    useEffect(() => {
        if (machine) navigation.setOptions({ title: machine.name });
    }, [machine?.name, navigation]);

    if (!machine) return null;

    return (
        <>
            <ScrollView
                style={{ flex: 1, backgroundColor: t.bg }}
                contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handlePhotoPress}
                    style={{
                        width: "100%",
                        height: photo ? 180 : 80,
                        borderRadius: 16,
                        marginBottom: 16,
                        backgroundColor: t.inputBg,
                        borderWidth: 0.5,
                        borderColor: t.border,
                        overflow: "hidden",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    {photo ? (
                        <Image
                            source={{ uri: photo }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={{ alignItems: "center", gap: 6 }}>
                            <Ionicons name="camera-outline" size={28} color={t.textDim} />
                            <Text style={{ color: t.textDim, fontSize: 12, fontWeight: "600" }}>
                                adicionar foto
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <CategoryBadge categoryKey={machine.categoryKey} />
                </View>
                {machine.description && (
                    <Text
                        style={{ color: t.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 16 }}
                    >
                        {machine.description}
                    </Text>
                )}

                <Text style={{ ...labelStyle, marginBottom: 12, marginLeft: 2 }}>historico</Text>

                {history.length === 0 ? (
                    <Text
                        style={{ color: t.textDim, textAlign: "center", marginTop: 24, fontSize: 14 }}
                    >
                        Nenhum registro ainda - inicie um treino para registrar pesos
                    </Text>
                ) : (
                    <View style={{ gap: 8 }}>
                        {history.map((item, index) => (
                            <AnimatedCard key={item.id} index={index}>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        backgroundColor: t.histBg,
                                        borderRadius: 12,
                                        paddingHorizontal: 16,
                                        paddingVertical: 12,
                                        borderWidth: 0.5,
                                        borderColor: t.border,
                                    }}
                                >
                                    <Text
                                        style={{ color: t.textMuted, fontSize: 13, fontWeight: "500" }}
                                    >
                                        {item.label}
                                    </Text>
                                    <View style={{ flexDirection: "row", gap: 14 }}>
                                        {item.sets.map((w, i) => (
                                            <Text
                                                key={i}
                                                style={{
                                                    color: t.accent,
                                                    fontSize: 14,
                                                    fontWeight: "700",
                                                }}
                                            >
                                                {w}
                                                <Text style={{ color: t.textMuted, fontSize: 11 }}>
                                                    kg
                                                </Text>
                                            </Text>
                                        ))}
                                    </View>
                                </View>
                            </AnimatedCard>
                        ))}
                    </View>
                )}
            </ScrollView>

            <AppModal visible={!!photoModal} onClose={closePhotoModal} contentStyle={{ padding: 24 }}>
                <Text
                    style={{
                        color: t.accent,
                        fontSize: 20,
                        fontWeight: "800",
                        marginBottom: 10,
                    }}
                >
                    {photoModal?.title ?? ""}
                </Text>
                {!!photoModal?.message && (
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 14,
                            lineHeight: 20,
                            marginBottom: 18,
                        }}
                    >
                        {photoModal.message}
                    </Text>
                )}

                <View style={{ gap: 10 }}>
                    {photoModal?.actions.map((action) => (
                        <TouchableOpacity key={action.label} activeOpacity={0.78} onPress={action.onPress}>
                            {action.variant === "accent" ? (
                                <LinearGradient
                                    colors={t.gradientAccent}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 10,
                                        paddingVertical: 14,
                                        paddingHorizontal: 16,
                                        borderRadius: 14,
                                    }}
                                >
                                    <Ionicons name={action.icon} size={18} color={btnColor} />
                                    <Text style={{ color: btnColor, fontSize: 15, fontWeight: "800" }}>
                                        {action.label}
                                    </Text>
                                </LinearGradient>
                            ) : (
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 10,
                                        paddingVertical: 14,
                                        paddingHorizontal: 16,
                                        borderRadius: 14,
                                        backgroundColor:
                                            action.variant === "danger" ? "#EF5350" : t.inputBg,
                                        borderWidth: action.variant === "danger" ? 0 : 0.5,
                                        borderColor: action.variant === "danger" ? "transparent" : t.border,
                                    }}
                                >
                                    <Ionicons
                                        name={action.icon}
                                        size={18}
                                        color={action.variant === "danger" ? "#FFF" : t.textMuted}
                                    />
                                    <Text
                                        style={{
                                            color: action.variant === "danger" ? "#FFF" : t.textMuted,
                                            fontSize: 15,
                                            fontWeight: "700",
                                        }}
                                    >
                                        {action.label}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {!photoModal?.hideCloseButton && (
                    <TouchableOpacity
                        onPress={closePhotoModal}
                        style={{ alignSelf: "flex-end", padding: 12, marginTop: 12 }}
                    >
                        <Text style={{ color: t.textMuted, fontSize: 15, fontWeight: "600" }}>
                            {photoModal?.closeLabel ?? "Cancelar"}
                        </Text>
                    </TouchableOpacity>
                )}
            </AppModal>
        </>
    );
}
