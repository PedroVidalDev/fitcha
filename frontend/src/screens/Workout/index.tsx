import { useDayMachines } from "@/src/hooks/useDayMachines";
import { useSaveWorkout } from "@/src/screens/Workout/hooks/useSaveWorkout";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Image,
    Animated as RNAnimated,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { CategoryBadge } from "../../components/CategoryBadge";
import { useTheme } from "../../contexts/ThemeContext";
import { formatTime } from "./helpers";
import { Route, WorkoutResult } from "./types";

export default function WorkoutScreen() {
    const { t } = useTheme();

    const navigation = useNavigation();
    const route = useRoute<Route>();
    const day = route.params.dayIndex;

    const { machines } = useDayMachines(day);
    const saveWorkout = useSaveWorkout();

    const [currentIdx, setCurrentIdx] = useState(0);
    const [set1, setSet1] = useState("");
    const [set2, setSet2] = useState("");
    const [set3, setSet3] = useState("");
    const [results, setResults] = useState<WorkoutResult[]>([]);
    const [elapsed, setElapsed] = useState(0);
    const startTime = useRef(Date.now()).current;

    const machine = machines[currentIdx];
    const isLast = currentIdx === machines.length - 1;
    const parseW = (v: string) => parseFloat(v.replace(",", "."));
    const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";

    const handleNext = () => {
        const s1 = parseW(set1),
            s2 = parseW(set2),
            s3 = parseW(set3);
        const allFilled = [s1, s2, s3].every((v) => !isNaN(v) && v > 0);

        if (!allFilled) {
            Alert.alert(
                "Pular máquina?",
                `Você não preencheu todos os pesos de "${machine.name}". Deseja pular?`,
                [
                    { text: "Voltar", style: "cancel" },
                    {
                        text: "Pular",
                        onPress: () => advanceToNext(null),
                    },
                ],
            );
            return;
        }

        advanceToNext({ machineId: machine.id, sets: [s1, s2, s3] });
    };

    const advanceToNext = (result: WorkoutResult | null) => {
        const newResults = result ? [...results, result] : results;
        setResults(newResults);
        setSet1("");
        setSet2("");
        setSet3("");

        if (isLast) {
            finishWorkout(newResults);
        } else {
            setCurrentIdx((p) => p + 1);
        }
    };

    const finishWorkout = async (finalResults: WorkoutResult[]) => {
        if (finalResults.length === 0) {
            Alert.alert("Treino vazio", "Nenhum peso foi registrado.");
            navigation.goBack();
            return;
        }
        await saveWorkout(finalResults);
        Alert.alert(
            "Treino finalizado!",
            `${finalResults.length} máquina${finalResults.length > 1 ? "s" : ""} registrada${finalResults.length > 1 ? "s" : ""} em ${formatTime(elapsed)}`,
            [{ text: "Fechar", onPress: () => navigation.goBack() }],
        );
    };

    const handleQuit = () => {
        Alert.alert("Encerrar treino?", "Os pesos já preenchidos serão salvos.", [
            { text: "Continuar", style: "cancel" },
            { text: "Encerrar", style: "destructive", onPress: () => finishWorkout(results) },
        ]);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const slideAnim = useRef(new RNAnimated.Value(30)).current;
    const fadeAnim = useRef(new RNAnimated.Value(0)).current;

    useEffect(() => {
        slideAnim.setValue(30);
        fadeAnim.setValue(0);
        RNAnimated.parallel([
            RNAnimated.spring(slideAnim, {
                toValue: 0,
                tension: 60,
                friction: 9,
                useNativeDriver: true,
            }),
            RNAnimated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
    }, [currentIdx]);

    if (!machine) return null;

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            {/* Timer bar */}
            <LinearGradient
                colors={t.gradientHero}
                style={{
                    paddingTop: 60,
                    paddingBottom: 16,
                    paddingHorizontal: 20,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <TouchableOpacity onPress={handleQuit} style={{ padding: 4 }}>
                    <Ionicons name="close" size={26} color={t.textMuted} />
                </TouchableOpacity>
                <View style={{ alignItems: "center" }}>
                    <Text
                        style={{
                            color: t.accent,
                            fontSize: 32,
                            fontWeight: "900",
                            fontVariant: ["tabular-nums"],
                        }}
                    >
                        {formatTime(elapsed)}
                    </Text>
                    <Text
                        style={{
                            color: t.textDim,
                            fontSize: 11,
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: 1,
                        }}
                    >
                        {currentIdx + 1} de {machines.length}
                    </Text>
                </View>
                <View style={{ width: 34 }} />
            </LinearGradient>

            {/* Progress bar */}
            <View
                style={{ flexDirection: "row", gap: 4, paddingHorizontal: 20, paddingVertical: 8 }}
            >
                {machines.map((_, i) => (
                    <View
                        key={i}
                        style={{
                            flex: 1,
                            height: 3,
                            borderRadius: 2,
                            backgroundColor:
                                i < currentIdx
                                    ? t.accent
                                    : i === currentIdx
                                      ? t.accent + "80"
                                      : t.inputBg,
                        }}
                    />
                ))}
            </View>

            {/* Máquina atual */}
            <RNAnimated.View
                style={{
                    flex: 1,
                    padding: 20,
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                }}
            >
                {/* Header da máquina */}
                <View style={{ alignItems: "center", marginBottom: 24 }}>
                    {machine.photo ? (
                        <Image
                            source={{ uri: machine.photo }}
                            style={{
                                width: "100%",
                                height: 140,
                                borderRadius: 16,
                                marginBottom: 14,
                            }}
                            resizeMode="cover"
                        />
                    ) : (
                        <View
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: 20,
                                backgroundColor: t.chipBg,
                                justifyContent: "center",
                                alignItems: "center",
                                marginBottom: 14,
                            }}
                        >
                            <Ionicons name="barbell-outline" size={36} color={t.accent} />
                        </View>
                    )}
                    <Text
                        style={{
                            color: t.textPrimary,
                            fontSize: 22,
                            fontWeight: "900",
                            textAlign: "center",
                        }}
                    >
                        {machine.name}
                    </Text>
                    <CategoryBadge categoryKey={machine.categoryKey} />
                </View>

                {/* Inputs das 3 séries */}
                <Text
                    style={{
                        color: t.textDim,
                        fontSize: 11,
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: 2,
                        marginBottom: 12,
                        marginLeft: 4,
                    }}
                >
                    preencha as 3 séries
                </Text>

                <View style={{ gap: 10 }}>
                    {[
                        { l: "Série 1", v: set1, fn: setSet1 },
                        { l: "Série 2", v: set2, fn: setSet2 },
                        { l: "Série 3", v: set3, fn: setSet3 },
                    ].map((item, i) => (
                        <View
                            key={i}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 12,
                                backgroundColor: t.inputBg,
                                borderRadius: 14,
                                paddingHorizontal: 16,
                                paddingVertical: 4,
                                borderWidth: 0.5,
                                borderColor: t.border,
                            }}
                        >
                            <Text
                                style={{
                                    color: t.textDim,
                                    fontSize: 13,
                                    fontWeight: "700",
                                    width: 55,
                                }}
                            >
                                {item.l}
                            </Text>
                            <TextInput
                                style={{
                                    flex: 1,
                                    padding: 14,
                                    color: t.textPrimary,
                                    fontSize: 20,
                                    fontWeight: "800",
                                    textAlign: "center",
                                }}
                                placeholder="0"
                                placeholderTextColor={t.textDim}
                                keyboardType="numeric"
                                value={item.v}
                                onChangeText={item.fn}
                            />
                            <Text style={{ color: t.textMuted, fontSize: 14, fontWeight: "600" }}>
                                kg
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Botão avançar */}
                <View style={{ flex: 1, justifyContent: "flex-end", paddingBottom: 20 }}>
                    <TouchableOpacity activeOpacity={0.75} onPress={handleNext}>
                        <LinearGradient
                            colors={t.gradientAccent}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                                paddingVertical: 16,
                                borderRadius: 16,
                            }}
                        >
                            <Ionicons
                                name={isLast ? "checkmark-done-circle" : "arrow-forward-circle"}
                                size={22}
                                color={btnColor}
                            />
                            <Text style={{ color: btnColor, fontSize: 17, fontWeight: "900" }}>
                                {isLast ? "Finalizar treino" : "Próxima máquina"}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </RNAnimated.View>
        </View>
    );
}
