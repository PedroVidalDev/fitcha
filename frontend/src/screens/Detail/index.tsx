import { RootStackParamList } from "@/src/router/types";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Image,
    Animated as RNAnimated,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { AnimatedCard } from "./../../components/AnimatedCard";
import { ConfirmModal } from "./../../components/ConfirmModal";
import { useTheme } from "./../../contexts/ThemeContext";
import { WeightDelta } from "./components/WeightDelta";
import { useMachineDetail } from "./hooks/useDetail";

type Route = RouteProp<RootStackParamList, "Detail">;

const DetailScreen = () => {
    const { t } = useTheme();

    const navigation = useNavigation();
    const route = useRoute<Route>();
    const { categoryId, machineId, machineName } = route.params;

    const [set1, setSet1] = useState("");
    const [set2, setSet2] = useState("");
    const [set3, setSet3] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

    const { currentSets, history, photo, addEntry, updatePhoto, removePhoto, deleteHistoryEntry } =
        useMachineDetail(categoryId, machineId);

    const scaleAnim = useRef(new RNAnimated.Value(0.8)).current;
    const fadeAnim = useRef(new RNAnimated.Value(0)).current;

    const pickFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permissão necessária", "Precisamos de acesso à galeria.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });
        if (!result.canceled && result.assets[0]) updatePhoto(result.assets[0].uri);
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permissão necessária", "Precisamos de acesso à câmera.");
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });
        if (!result.canceled && result.assets[0]) updatePhoto(result.assets[0].uri);
    };

    const showPhotoSource = () => {
        Alert.alert("Adicionar foto", "De onde?", [
            { text: "Câmera", onPress: takePhoto },
            { text: "Galeria", onPress: pickFromGallery },
            { text: "Cancelar", style: "cancel" },
        ]);
    };

    const handlePhotoPress = () => {
        if (photo) {
            Alert.alert("Foto da máquina", "", [
                { text: "Trocar foto", onPress: showPhotoSource },
                { text: "Remover foto", style: "destructive", onPress: removePhoto },
                { text: "Cancelar", style: "cancel" },
            ]);
        } else {
            showPhotoSource();
        }
    };

    const parseW = (v: string) => parseFloat(v.replace(",", "."));

    const handleSave = () => {
        const s1 = parseW(set1),
            s2 = parseW(set2),
            s3 = parseW(set3);
        if ([s1, s2, s3].some((v) => isNaN(v) || v <= 0)) return;
        RNAnimated.sequence([
            RNAnimated.spring(scaleAnim, {
                toValue: 1.1,
                tension: 100,
                friction: 5,
                useNativeDriver: true,
            }),
            RNAnimated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
        addEntry([s1, s2, s3]);
        setSet1("");
        setSet2("");
        setSet3("");
    };

    const maxW = currentSets ? Math.max(...currentSets) : null;
    const prevMax = history.length >= 2 ? Math.max(...history[1].sets) : undefined;

    const labelStyle = {
        color: t.textDim,
        fontSize: 11,
        fontWeight: "700" as const,
        textTransform: "uppercase" as const,
        letterSpacing: 2,
    };

    useEffect(() => {
        RNAnimated.parallel([
            RNAnimated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            RNAnimated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]).start();
    }, [currentSets]);

    useEffect(() => {
        navigation.setOptions({
            title: machineName ?? "Detalhe",
        });
    }, [machineName]);

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
                            adicionar foto da máquina
                        </Text>
                    </View>
                )}
                {photo && (
                    <View
                        style={{
                            position: "absolute",
                            bottom: 8,
                            right: 8,
                            backgroundColor: "rgba(0,0,0,0.5)",
                            borderRadius: 20,
                            width: 32,
                            height: 32,
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <Ionicons name="pencil" size={14} color="#FFF" />
                    </View>
                )}
            </TouchableOpacity>

            {/* Hero */}
            <LinearGradient
                colors={t.gradientHero}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    alignItems: "center",
                    paddingVertical: 32,
                    borderRadius: 20,
                    marginBottom: 20,
                    borderWidth: 0.5,
                    borderColor: t.border,
                }}
            >
                <Text style={labelStyle}>séries atuais</Text>
                {currentSets ? (
                    <RNAnimated.View
                        style={{
                            transform: [{ scale: scaleAnim }],
                            opacity: fadeAnim,
                            alignItems: "center",
                        }}
                    >
                        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                            {currentSets.map((w, i) => (
                                <View
                                    key={i}
                                    style={{
                                        alignItems: "center",
                                        backgroundColor: t.chipBg,
                                        borderRadius: 14,
                                        paddingVertical: 12,
                                        paddingHorizontal: 18,
                                        borderWidth: 0.5,
                                        borderColor: t.border,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: t.textDim,
                                            fontSize: 10,
                                            fontWeight: "700",
                                            textTransform: "uppercase",
                                            letterSpacing: 1,
                                        }}
                                    >
                                        S{i + 1}
                                    </Text>
                                    <Text
                                        style={{
                                            color: t.accent,
                                            fontSize: 28,
                                            fontWeight: "900",
                                            marginTop: 2,
                                        }}
                                    >
                                        {w}
                                    </Text>
                                    <Text
                                        style={{
                                            color: t.textMuted,
                                            fontSize: 11,
                                            fontWeight: "600",
                                            marginTop: 2,
                                        }}
                                    >
                                        kg
                                    </Text>
                                </View>
                            ))}
                        </View>
                        <Text
                            style={{
                                color: t.textMuted,
                                fontSize: 13,
                                fontWeight: "600",
                                marginTop: 12,
                            }}
                        >
                            máx{" "}
                            <Text style={{ color: t.accent, fontWeight: "800", fontSize: 15 }}>
                                {maxW} kg
                            </Text>
                        </Text>
                    </RNAnimated.View>
                ) : (
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 48,
                            fontWeight: "900",
                            marginTop: 8,
                        }}
                    >
                        —
                    </Text>
                )}
                {maxW != null && prevMax != null && (
                    <WeightDelta current={maxW} previous={prevMax} />
                )}
            </LinearGradient>

            {/* Inputs */}
            <Text style={{ ...labelStyle, marginBottom: 10, marginLeft: 2 }}>registrar treino</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
                {[
                    { l: "Série 1", v: set1, fn: setSet1 },
                    { l: "Série 2", v: set2, fn: setSet2 },
                    { l: "Série 3", v: set3, fn: setSet3 },
                ].map((item, i) => (
                    <View key={i} style={{ flex: 1 }}>
                        <Text
                            style={{
                                color: t.textMuted,
                                fontSize: 11,
                                fontWeight: "700",
                                marginBottom: 6,
                                marginLeft: 4,
                            }}
                        >
                            {item.l}
                        </Text>
                        <TextInput
                            style={{
                                backgroundColor: t.inputBg,
                                borderRadius: 12,
                                padding: 14,
                                color: t.textPrimary,
                                fontSize: 16,
                                fontWeight: "700",
                                textAlign: "center",
                                borderWidth: 0.5,
                                borderColor: t.border,
                            }}
                            placeholder="kg"
                            placeholderTextColor={t.textDim}
                            keyboardType="numeric"
                            value={item.v}
                            onChangeText={item.fn}
                        />
                    </View>
                ))}
            </View>

            <TouchableOpacity activeOpacity={0.75} onPress={handleSave}>
                <LinearGradient
                    colors={t.gradientAccent}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        paddingVertical: 14,
                        borderRadius: 14,
                        marginBottom: 4,
                    }}
                >
                    <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={t.mode === "dark" ? "#0d0500" : "#FFF"}
                    />
                    <Text
                        style={{
                            color: t.mode === "dark" ? "#0d0500" : "#FFF",
                            fontSize: 16,
                            fontWeight: "800",
                        }}
                    >
                        Salvar
                    </Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* Histórico */}
            <Text style={{ ...labelStyle, marginTop: 24, marginBottom: 12, marginLeft: 2 }}>
                histórico
            </Text>

            {history.length === 0 ? (
                <Text
                    style={{
                        color: t.textDim,
                        textAlign: "center",
                        marginTop: 24,
                        fontSize: 14,
                        fontWeight: "500",
                    }}
                >
                    Nenhum registro ainda
                </Text>
            ) : (
                <View style={{ gap: 8 }}>
                    {history.map((item, index) => (
                        <AnimatedCard key={item.id} index={index}>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onLongPress={() =>
                                    setDeleteTarget({ id: item.id, label: item.label })
                                }
                                delayLongPress={400}
                            >
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
                                        style={{
                                            color: t.textMuted,
                                            fontSize: 13,
                                            fontWeight: "500",
                                        }}
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
                                                <Text
                                                    style={{
                                                        color: t.textMuted,
                                                        fontSize: 11,
                                                        fontWeight: "500",
                                                    }}
                                                >
                                                    kg
                                                </Text>
                                            </Text>
                                        ))}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </AnimatedCard>
                    ))}
                </View>
            )}

            <ConfirmModal
                visible={!!deleteTarget}
                title="Remover registro"
                message={`Deseja remover o registro de "${deleteTarget?.label}"?`}
                confirmLabel="Remover"
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (deleteTarget) deleteHistoryEntry(deleteTarget.id);
                    setDeleteTarget(null);
                }}
            />
        </ScrollView>
    );
};

export default DetailScreen;
