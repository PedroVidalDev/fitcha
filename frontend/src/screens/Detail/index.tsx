import { RootStackParamList } from "@/src/router/types";
import { useMachineHistory } from "@/src/screens/Detail/hooks/useMachineHistory";
import { useMachinePhoto } from "@/src/screens/Detail/hooks/useMachinePhoto";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useEffect } from "react";
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { AnimatedCard } from "../../components/AnimatedCard";
import { CategoryBadge } from "../../components/CategoryBadge";
import { useTheme } from "../../contexts/ThemeContext";

type Route = RouteProp<RootStackParamList, "MachineDetail">;

export default function MachineDetailScreen() {
    const { t } = useTheme();

    const route = useRoute<Route>();
    const navigation = useNavigation();
    const { machineId } = route.params;

    const { machine, history } = useMachineHistory(machineId);
    const { photo, updatePhoto, removePhoto } = useMachinePhoto(machineId);

    const pickFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") return;
        const r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });
        if (!r.canceled && r.assets[0]) updatePhoto(r.assets[0].uri);
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") return;
        const r = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });
        if (!r.canceled && r.assets[0]) updatePhoto(r.assets[0].uri);
    };

    const handlePhotoPress = () => {
        if (photo) {
            Alert.alert("Foto", "", [
                {
                    text: "Trocar",
                    onPress: () =>
                        Alert.alert("De onde?", "", [
                            { text: "Câmera", onPress: takePhoto },
                            { text: "Galeria", onPress: pickFromGallery },
                            { text: "Cancelar", style: "cancel" },
                        ]),
                },
                { text: "Remover", style: "destructive", onPress: removePhoto },
                { text: "Cancelar", style: "cancel" },
            ]);
        } else {
            Alert.alert("Adicionar foto", "De onde?", [
                { text: "Câmera", onPress: takePhoto },
                { text: "Galeria", onPress: pickFromGallery },
                { text: "Cancelar", style: "cancel" },
            ]);
        }
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
    }, [machine?.name]);

    if (!machine) return null;

    return (
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

            <Text style={{ ...labelStyle, marginBottom: 12, marginLeft: 2 }}>histórico</Text>

            {history.length === 0 ? (
                <Text
                    style={{ color: t.textDim, textAlign: "center", marginTop: 24, fontSize: 14 }}
                >
                    Nenhum registro ainda — inicie um treino para registrar pesos
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
    );
}
