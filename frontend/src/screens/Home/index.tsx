import {
    DashboardMachineProgress,
    DashboardPlanDay,
    useDashboardSummary,
} from "@/src/hooks/useDashboardSummary";
import { RootStackParamList } from "@/src/router/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode, useCallback } from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import { AnimatedCard } from "../../components/AnimatedCard";
import { CategoryBadge } from "../../components/CategoryBadge";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

type Navigation = NativeStackNavigationProp<RootStackParamList, "Home">;

function getFirstName(name?: string) {
    const [firstName] = name?.trim().split(/\s+/) ?? [];
    return firstName || "atleta";
}

function formatWeight(value: number | null) {
    return value === null ? "--" : `${value}kg`;
}

function formatDelta(value: number | null) {
    if (value === null) return "Sem base";
    if (value > 0) return `+${value} kg`;
    if (value < 0) return `${value} kg`;
    return "0 kg";
}

function getFeaturedPlanCopy(featuredPlanDay: DashboardPlanDay | null) {
    if (!featuredPlanDay) {
        return {
            title: "evolução por máquina",
            subtitle: "Monte a semana para destravar essa comparação por exercício.",
        };
    }

    if (featuredPlanDay.isToday) {
        return {
            title: "máquinas de hoje",
            subtitle: "Arraste para o lado e veja a evolução de carga em cada máquina.",
        };
    }

    return {
        title: `próximo treino - ${featuredPlanDay.label.toLowerCase()}`,
        subtitle: "Hoje não há máquinas planejadas, então a comparação usa o próximo dia ativo.",
    };
}

function DashboardPanel({ children }: { children: ReactNode }) {
    const { t } = useTheme();

    return (
        <View
            style={{
                borderRadius: 22,
                overflow: "hidden",
                ...Platform.select({
                    ios: {
                        shadowColor: t.shadow,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.08,
                        shadowRadius: 12,
                    },
                    android: { elevation: 5 },
                }),
            }}
        >
            <LinearGradient
                colors={t.gradientCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    borderRadius: 22,
                    padding: 18,
                    borderWidth: 0.5,
                    borderColor: t.border,
                }}
            >
                {children}
            </LinearGradient>
        </View>
    );
}

function StatCard(props: {
    title: string;
    value: string;
    hint: string;
    icon: keyof typeof Ionicons.glyphMap;
}) {
    const { title, value, hint, icon } = props;
    const { t } = useTheme();

    return (
        <View
            style={{
                flex: 1,
                minWidth: 0,
                backgroundColor: t.inputBg,
                borderRadius: 18,
                padding: 14,
                borderWidth: 0.5,
                borderColor: t.border,
            }}
        >
            <View
                style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    backgroundColor: t.chipBg,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 12,
                }}
            >
                <Ionicons name={icon} size={18} color={t.accent} />
            </View>
            <Text
                style={{
                    color: t.textDim,
                    fontSize: 11,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 1.6,
                }}
            >
                {title}
            </Text>
            <Text
                style={{
                    color: t.textPrimary,
                    fontSize: 23,
                    fontWeight: "900",
                    marginTop: 6,
                }}
            >
                {value}
            </Text>
            <Text style={{ color: t.textMuted, fontSize: 12, lineHeight: 17, marginTop: 4 }}>
                {hint}
            </Text>
        </View>
    );
}

function MachineProgressCard(props: { item: DashboardMachineProgress; width: number }) {
    const { item, width } = props;
    const { t } = useTheme();

    const chartMax = Math.max(...item.points.map((point) => point.maxWeight), 1);
    const deltaColor =
        item.deltaFromStart === null
            ? t.textMuted
            : item.deltaFromStart >= 0
              ? t.accent
              : "#EF5350";
    const comparisonText =
        item.deltaFromStart === null
            ? item.latestWeight === null
                ? "Ainda não existe treino salvo nessa máquina."
                : "Salve mais um treino para comparar a evolução."
            : "Comparação da carga atual contra o primeiro registro salvo.";
    const previousDeltaText =
        item.deltaFromPrevious === null
            ? item.sessionCount === 0
                ? "sem histórico"
                : item.sessionCount === 1
                  ? "1 registro salvo"
                  : "sem comparação"
            : `${item.deltaFromPrevious > 0 ? "+" : ""}${item.deltaFromPrevious} kg vs. último treino`;

    return (
        <View
            style={{
                width,
                backgroundColor: t.inputBg,
                borderRadius: 20,
                padding: 16,
                borderWidth: 0.5,
                borderColor: t.border,
            }}
        >
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                }}
            >
                <CategoryBadge categoryKey={item.categoryKey} />

                <View
                    style={{
                        backgroundColor: t.chipBg,
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                    }}
                >
                    <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: "700" }}>
                        {item.lastTrainedLabel ? `último ${item.lastTrainedLabel}` : "sem treino"}
                    </Text>
                </View>
            </View>

            <Text
                style={{
                    color: t.textPrimary,
                    fontSize: 22,
                    fontWeight: "900",
                    marginTop: 14,
                }}
            >
                {item.name}
            </Text>

            <Text
                style={{
                    color: deltaColor,
                    fontSize: 28,
                    fontWeight: "900",
                    marginTop: 14,
                }}
            >
                {formatDelta(item.deltaFromStart)}
            </Text>

            <Text
                style={{
                    color: t.textMuted,
                    fontSize: 13,
                    lineHeight: 18,
                    marginTop: 6,
                }}
            >
                {comparisonText}
            </Text>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: t.card,
                        borderRadius: 16,
                        padding: 12,
                    }}
                >
                    <Text
                        style={{
                            color: t.textDim,
                            fontSize: 10,
                            fontWeight: "800",
                            textTransform: "uppercase",
                            letterSpacing: 1.2,
                        }}
                    >
                        atual
                    </Text>
                    <Text
                        style={{
                            color: t.textPrimary,
                            fontSize: 18,
                            fontWeight: "900",
                            marginTop: 6,
                        }}
                    >
                        {formatWeight(item.latestWeight)}
                    </Text>
                </View>

                <View
                    style={{
                        flex: 1,
                        backgroundColor: t.card,
                        borderRadius: 16,
                        padding: 12,
                    }}
                >
                    <Text
                        style={{
                            color: t.textDim,
                            fontSize: 10,
                            fontWeight: "800",
                            textTransform: "uppercase",
                            letterSpacing: 1.2,
                        }}
                    >
                        inicial
                    </Text>
                    <Text
                        style={{
                            color: t.textPrimary,
                            fontSize: 18,
                            fontWeight: "900",
                            marginTop: 6,
                        }}
                    >
                        {formatWeight(item.firstWeight)}
                    </Text>
                </View>

                <View
                    style={{
                        flex: 1,
                        backgroundColor: t.card,
                        borderRadius: 16,
                        padding: 12,
                    }}
                >
                    <Text
                        style={{
                            color: t.textDim,
                            fontSize: 10,
                            fontWeight: "800",
                            textTransform: "uppercase",
                            letterSpacing: 1.2,
                        }}
                    >
                        recorde
                    </Text>
                    <Text
                        style={{
                            color: t.textPrimary,
                            fontSize: 18,
                            fontWeight: "900",
                            marginTop: 6,
                        }}
                    >
                        {formatWeight(item.bestWeight)}
                    </Text>
                </View>
            </View>

            {item.points.length === 0 ? (
                <View
                    style={{
                        backgroundColor: t.card,
                        borderRadius: 16,
                        padding: 16,
                        marginTop: 18,
                    }}
                >
                    <Text style={{ color: t.textMuted, fontSize: 13, lineHeight: 18 }}>
                        Essa máquina já está no dia planejado, mas ainda não tem histórico salvo.
                    </Text>
                </View>
            ) : (
                <View style={{ marginTop: 18 }}>
                    <Text
                        style={{
                            color: t.textDim,
                            fontSize: 10,
                            fontWeight: "800",
                            textTransform: "uppercase",
                            letterSpacing: 1.2,
                            marginBottom: 10,
                        }}
                    >
                        últimos registros
                    </Text>

                    <View
                        style={{
                            height: 118,
                            flexDirection: "row",
                            alignItems: "flex-end",
                            gap: 8,
                        }}
                    >
                        {item.points.map((point, index) => {
                            const height = Math.max(
                                24,
                                Math.round((point.maxWeight / chartMax) * 62),
                            );
                            const isLatest = index === item.points.length - 1;

                            return (
                                <View
                                    key={point.key}
                                    style={{
                                        flex: 1,
                                        alignItems: "center",
                                        justifyContent: "flex-end",
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: isLatest ? t.accent : t.textDim,
                                            fontSize: 10,
                                            fontWeight: "800",
                                            marginBottom: 6,
                                        }}
                                    >
                                        {point.maxWeight}
                                    </Text>
                                    <LinearGradient
                                        colors={
                                            isLatest ? t.gradientAccent : [t.accentDark, t.accent]
                                        }
                                        start={{ x: 0, y: 1 }}
                                        end={{ x: 0, y: 0 }}
                                        style={{
                                            width: "100%",
                                            height,
                                            borderRadius: 14,
                                            opacity: isLatest ? 1 : 0.7,
                                        }}
                                    />
                                    <Text
                                        style={{
                                            color: isLatest ? t.textPrimary : t.textMuted,
                                            fontSize: 10,
                                            fontWeight: "700",
                                            marginTop: 8,
                                        }}
                                    >
                                        {point.label}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}

            <Text
                style={{
                    color: t.textMuted,
                    fontSize: 12,
                    lineHeight: 18,
                    marginTop: 14,
                }}
            >
                {previousDeltaText}
            </Text>
        </View>
    );
}

export default function HomeScreen() {
    const { t } = useTheme();
    const { user } = useAuth();
    const navigation = useNavigation<Navigation>();
    const { width } = useWindowDimensions();
    const { summary, isLoading, refresh } = useDashboardSummary();

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh]),
    );

    if (isLoading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: t.bg,
                }}
            >
                <ActivityIndicator size="large" color={t.accent} />
            </View>
        );
    }

    const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";
    const firstName = getFirstName(user?.name);
    const featuredPlanCopy = getFeaturedPlanCopy(summary.featuredPlanDay);
    const progressCardWidth = Math.min(Math.max(width - 84, 272), 332);

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: t.bg }}
            contentContainerStyle={{ padding: 16, paddingBottom: 36, gap: 14 }}
            showsVerticalScrollIndicator={false}
        >
            <AnimatedCard index={0}>
                <View
                    style={{
                        borderRadius: 24,
                        overflow: "hidden",
                        ...Platform.select({
                            ios: {
                                shadowColor: t.shadow,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 14,
                            },
                            android: { elevation: 6 },
                        }),
                    }}
                >
                    <LinearGradient
                        colors={t.gradientHero}
                        style={{
                            padding: 20,
                            borderRadius: 24,
                            borderWidth: 0.5,
                            borderColor: t.border,
                        }}
                    >
                        <Text
                            style={{
                                color: t.textDim,
                                fontSize: 11,
                                fontWeight: "700",
                                textTransform: "uppercase",
                                letterSpacing: 2,
                            }}
                        >
                            painel inicial
                        </Text>
                        <Text
                            style={{
                                color: t.textPrimary,
                                fontSize: 28,
                                fontWeight: "900",
                                marginTop: 8,
                            }}
                        >
                            Olá, {firstName}
                        </Text>
                        <Text
                            style={{
                                color: t.textMuted,
                                fontSize: 14,
                                lineHeight: 21,
                                marginTop: 10,
                            }}
                        >
                            {summary.hasHistory
                                ? `Sequência atual de ${summary.streak} dia${summary.streak !== 1 ? "s" : ""} e ${summary.recentWorkoutDays} dia${summary.recentWorkoutDays !== 1 ? "s" : ""} ativo${summary.recentWorkoutDays !== 1 ? "s" : ""} nos últimos 7 dias.`
                                : "Sua semana já pode ser organizada aqui, mas a análise fica muito melhor depois do primeiro treino salvo."}
                        </Text>

                        <View
                            style={{
                                flexDirection: "row",
                                gap: 12,
                                marginTop: 20,
                            }}
                        >
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: t.inputBg,
                                    borderRadius: 18,
                                    padding: 14,
                                    borderWidth: 0.5,
                                    borderColor: t.border,
                                }}
                            >
                                <Text
                                    style={{
                                        color: t.textDim,
                                        fontSize: 10,
                                        fontWeight: "800",
                                        textTransform: "uppercase",
                                        letterSpacing: 1.2,
                                    }}
                                >
                                    último treino
                                </Text>
                                <Text
                                    style={{
                                        color: t.textPrimary,
                                        fontSize: 22,
                                        fontWeight: "900",
                                        marginTop: 6,
                                    }}
                                >
                                    {summary.lastWorkoutLabel ?? "sem registro"}
                                </Text>
                            </View>

                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: t.inputBg,
                                    borderRadius: 18,
                                    padding: 14,
                                    borderWidth: 0.5,
                                    borderColor: t.border,
                                }}
                            >
                                <Text
                                    style={{
                                        color: t.textDim,
                                        fontSize: 10,
                                        fontWeight: "800",
                                        textTransform: "uppercase",
                                        letterSpacing: 1.2,
                                    }}
                                >
                                    próximo alvo
                                </Text>
                                <Text
                                    style={{
                                        color: t.textPrimary,
                                        fontSize: 18,
                                        fontWeight: "900",
                                        marginTop: 6,
                                    }}
                                >
                                    {summary.nextPlannedDayLabel ?? "monte sua semana"}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.82}
                            onPress={() => navigation.navigate("Week")}
                            style={{ marginTop: 18 }}
                        >
                            <LinearGradient
                                colors={t.gradientAccent}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 10,
                                    paddingVertical: 15,
                                    borderRadius: 18,
                                }}
                            >
                                <Ionicons name="calendar-outline" size={20} color={btnColor} />
                                <Text style={{ color: btnColor, fontSize: 16, fontWeight: "900" }}>
                                    Abrir semana
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </AnimatedCard>

            <AnimatedCard index={1}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                    <StatCard
                        title="Sequência"
                        value={`${summary.streak}`}
                        hint={`dias seguidos${summary.streak === 0 ? " por enquanto" : ""}`}
                        icon="flame-outline"
                    />
                    <StatCard
                        title="Últimos 7 dias"
                        value={`${summary.recentWorkoutDays}/7`}
                        hint="dias com treino salvo"
                        icon="pulse-outline"
                    />
                </View>
            </AnimatedCard>

            <AnimatedCard index={2}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                    <StatCard
                        title="No mês"
                        value={`${summary.monthlyWorkoutDays}`}
                        hint="dias indo para a academia"
                        icon="barbell-outline"
                    />
                    <StatCard
                        title="Semana"
                        value={`${summary.scheduledDayCount}`}
                        hint={`${summary.totalMachinesScheduled} máquinas planejadas`}
                        icon="calendar-clear-outline"
                    />
                </View>
            </AnimatedCard>

            <AnimatedCard index={3}>
                <DashboardPanel>
                    <Text
                        style={{
                            color: t.textDim,
                            fontSize: 11,
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: 2,
                        }}
                    >
                        {featuredPlanCopy.title}
                    </Text>
                    <Text
                        style={{
                            color: t.textPrimary,
                            fontSize: 24,
                            fontWeight: "900",
                            marginTop: 8,
                        }}
                    >
                        {summary.featuredPlanDay
                            ? `${summary.machineProgress.length} máquina${summary.machineProgress.length !== 1 ? "s" : ""} em foco`
                            : "Nenhum dia planejado ainda"}
                    </Text>
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 13,
                            lineHeight: 19,
                            marginTop: 6,
                        }}
                    >
                        {featuredPlanCopy.subtitle}
                    </Text>

                    {summary.featuredPlanDay ? (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 12, paddingRight: 4, marginTop: 18 }}
                            snapToInterval={progressCardWidth + 12}
                            decelerationRate="fast"
                        >
                            {summary.machineProgress.map((item) => (
                                <MachineProgressCard
                                    key={item.machineId}
                                    item={item}
                                    width={progressCardWidth}
                                />
                            ))}
                        </ScrollView>
                    ) : (
                        <View
                            style={{
                                backgroundColor: t.inputBg,
                                borderRadius: 18,
                                padding: 16,
                                marginTop: 18,
                                borderWidth: 0.5,
                                borderColor: t.border,
                            }}
                        >
                            <Text style={{ color: t.textMuted, fontSize: 14, lineHeight: 20 }}>
                                Abra a Week, distribua as máquinas nos dias da semana e essa área
                                passa a mostrar a evolução de cada uma.
                            </Text>
                        </View>
                    )}
                </DashboardPanel>
            </AnimatedCard>

            <AnimatedCard index={4}>
                <DashboardPanel>
                    <Text
                        style={{
                            color: t.textDim,
                            fontSize: 11,
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: 2,
                        }}
                    >
                        ritmo da semana
                    </Text>
                    <Text
                        style={{
                            color: t.textPrimary,
                            fontSize: 24,
                            fontWeight: "900",
                            marginTop: 8,
                        }}
                    >
                        {summary.scheduledDayCount > 0
                            ? `${summary.scheduledDayCount} dia${summary.scheduledDayCount > 1 ? "s" : ""} já montado${summary.scheduledDayCount > 1 ? "s" : ""}`
                            : "Sua semana ainda está vazia"}
                    </Text>
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 13,
                            lineHeight: 19,
                            marginTop: 6,
                        }}
                    >
                        {summary.nextPlannedDayLabel
                            ? `Próximo compromisso: ${summary.nextPlannedDayLabel}.`
                            : "Abra a Week para montar os dias, máquinas e categorias que quer seguir."}
                    </Text>

                    <View
                        style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 }}
                    >
                        {summary.weekPlan.map((day) => {
                            const isActive = day.machineCount > 0;

                            return (
                                <View
                                    key={day.dayIndex}
                                    style={{
                                        width: "22%",
                                        minWidth: 68,
                                        backgroundColor: day.isToday ? t.chipBg : t.inputBg,
                                        borderRadius: 18,
                                        paddingVertical: 12,
                                        paddingHorizontal: 10,
                                        borderWidth: 0.5,
                                        borderColor: day.isToday ? t.accent : t.border,
                                        opacity: isActive ? 1 : 0.72,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: day.isToday ? t.accent : t.textDim,
                                            fontSize: 11,
                                            fontWeight: "800",
                                            textTransform: "uppercase",
                                            letterSpacing: 1.2,
                                        }}
                                    >
                                        {day.shortLabel}
                                    </Text>
                                    <Text
                                        style={{
                                            color: isActive ? t.textPrimary : t.textMuted,
                                            fontSize: 20,
                                            fontWeight: "900",
                                            marginTop: 8,
                                        }}
                                    >
                                        {day.machineCount}
                                    </Text>
                                    <Text
                                        style={{ color: t.textMuted, fontSize: 11, marginTop: 2 }}
                                    >
                                        máquina{day.machineCount !== 1 ? "s" : ""}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </DashboardPanel>
            </AnimatedCard>
        </ScrollView>
    );
}
