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
import { useI18n } from "../../contexts/I18nContext";
import { useTheme } from "../../contexts/ThemeContext";
import { HistorySet } from "../../dtos/HistoryEntry";
import { formatSetSequence } from "../../utils/workoutRecords";

type Navigation = NativeStackNavigationProp<RootStackParamList, "Home">;

function getFirstName(name?: string, fallback = "athlete") {
    const [firstName] = name?.trim().split(/\s+/) ?? [];
    return firstName || fallback;
}

function formatWeight(value: number | null) {
    return value === null ? "--" : `${value}kg`;
}

function formatRecord(value: HistorySet[] | null) {
    return value === null ? "--" : formatSetSequence(value);
}

function getStatTone(index: number, mode: "dark" | "light") {
    const tones =
        mode === "dark"
            ? [
                  {
                      background: "rgba(244, 162, 97, 0.12)",
                      border: "rgba(244, 162, 97, 0.28)",
                      iconBg: "rgba(244, 162, 97, 0.18)",
                      iconColor: "#F4A261",
                  },
                  {
                      background: "rgba(224, 122, 47, 0.14)",
                      border: "rgba(224, 122, 47, 0.28)",
                      iconBg: "rgba(224, 122, 47, 0.2)",
                      iconColor: "#E07A2F",
                  },
                  {
                      background: "rgba(255, 208, 112, 0.14)",
                      border: "rgba(255, 208, 112, 0.28)",
                      iconBg: "rgba(255, 208, 112, 0.2)",
                      iconColor: "#FFD070",
                  },
              ]
            : [
                  {
                      background: "#FFF4EA",
                      border: "rgba(194, 101, 26, 0.14)",
                      iconBg: "#FFE2C6",
                      iconColor: "#C2651A",
                  },
                  {
                      background: "#FFF0E2",
                      border: "rgba(163, 82, 15, 0.14)",
                      iconBg: "#FFD8B6",
                      iconColor: "#A3520F",
                  },
                  {
                      background: "#FFF8DE",
                      border: "rgba(224, 122, 47, 0.16)",
                      iconBg: "#FFE9A8",
                      iconColor: "#C98200",
                  },
              ];

    return tones[index] ?? tones[0];
}

function getRecordPalette(mode: "dark" | "light") {
    return mode === "dark"
        ? {
              cardBg: "rgba(244, 162, 97, 0.14)",
              cardBorder: "rgba(255, 208, 112, 0.26)",
              cardGlow: "rgba(255, 208, 112, 0.14)",
              sequence: "#FFF1DC",
              volume: "#FFD070",
          }
        : {
              cardBg: "#FFF3E4",
              cardBorder: "rgba(224, 122, 47, 0.16)",
              cardGlow: "#FFF0C2",
              sequence: "#4A1F00",
              volume: "#A3520F",
          };
}

function getChartColors(
    index: number,
    isLatest: boolean,
    mode: "dark" | "light",
): [string, string] {
    if (isLatest) {
        return mode === "dark" ? ["#FFD070", "#F4A261"] : ["#FFD070", "#E07A2F"];
    }

    const palettes =
        mode === "dark"
            ? [
                  ["#FB923C", "#F97316"],
                  ["#F4A261", "#E07A2F"],
                  ["#FFD070", "#E9A800"],
              ]
            : [
                  ["#FDBA74", "#EA580C"],
                  ["#F4A261", "#C2651A"],
                  ["#FFE08A", "#D49A00"],
              ];

    return palettes[index % palettes.length] as [string, string];
}

function formatDelta(
    value: number | null,
    t: (
        key: "home.delta.noBase" | "home.delta.zero",
        params?: Record<string, number | string>,
    ) => string,
) {
    if (value === null) return t("home.delta.noBase");
    if (value > 0) return `+${value} kg`;
    if (value < 0) return `${value} kg`;
    return t("home.delta.zero");
}

function getFeaturedPlanCopy(
    featuredPlanDay: DashboardPlanDay | null,
    t: (
        key:
            | "home.featured.emptyTitle"
            | "home.featured.emptySubtitle"
            | "home.featured.todayTitle"
            | "home.featured.todaySubtitle"
            | "home.featured.nextTitle"
            | "home.featured.nextSubtitle",
        params?: Record<string, number | string>,
    ) => string,
) {
    if (!featuredPlanDay) {
        return {
            title: t("home.featured.emptyTitle"),
            subtitle: t("home.featured.emptySubtitle"),
        };
    }

    if (featuredPlanDay.isToday) {
        return {
            title: t("home.featured.todayTitle"),
            subtitle: t("home.featured.todaySubtitle"),
        };
    }

    return {
        title: t("home.featured.nextTitle", { day: featuredPlanDay.label.toLowerCase() }),
        subtitle: t("home.featured.nextSubtitle"),
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
    index: number;
    title: string;
    value: string;
    hint: string;
    icon: keyof typeof Ionicons.glyphMap;
}) {
    const { index, title, value, hint, icon } = props;
    const { t } = useTheme();
    const tone = getStatTone(index, t.mode);

    return (
        <View
            style={{
                flex: 1,
                minWidth: 0,
                backgroundColor: tone.background,
                borderRadius: 18,
                padding: 14,
                borderWidth: 1,
                borderColor: tone.border,
            }}
        >
            <View
                style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    backgroundColor: tone.iconBg,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 12,
                }}
            >
                <Ionicons name={icon} size={18} color={tone.iconColor} />
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
    const { t: translate } = useI18n();
    const currentTone = getStatTone(0, t.mode);
    const initialTone = getStatTone(1, t.mode);
    const recordPalette = getRecordPalette(t.mode);

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
                ? translate("home.machine.comparison.noHistory")
                : translate("home.machine.comparison.needMore")
            : translate("home.machine.comparison.default");
    const previousDeltaText =
        item.deltaFromPrevious === null
            ? item.sessionCount === 0
                ? translate("home.machine.previous.noHistory")
                : item.sessionCount === 1
                  ? translate("home.machine.previous.oneRecord")
                  : translate("home.machine.previous.noComparison")
            : translate("home.machine.previous.vsLast", {
                  value: `${item.deltaFromPrevious > 0 ? "+" : ""}${item.deltaFromPrevious} kg`,
              });

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
                        {item.lastTrainedLabel
                            ? translate("home.machine.lastTrained", {
                                  label: item.lastTrainedLabel,
                              })
                            : translate("home.machine.noTraining")}
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
                {formatDelta(item.deltaFromStart, translate)}
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
                        backgroundColor: currentTone.background,
                        borderRadius: 16,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: currentTone.border,
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
                        {translate("home.machine.metric.current")}
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
                        backgroundColor: initialTone.background,
                        borderRadius: 16,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: initialTone.border,
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
                        {translate("home.machine.metric.initial")}
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
                        backgroundColor: recordPalette.cardBg,
                        borderRadius: 16,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: recordPalette.cardBorder,
                        overflow: "hidden",
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
                        {translate("home.machine.metric.record")}
                    </Text>
                    <Text
                        style={{
                            color: recordPalette.sequence,
                            fontSize: 17,
                            fontWeight: "900",
                            marginTop: 6,
                        }}
                    >
                        {formatRecord(item.bestRecordSets)}
                    </Text>
                    <Text
                        style={{
                            color: recordPalette.volume,
                            fontSize: 12,
                            lineHeight: 17,
                            marginTop: 4,
                            fontWeight: "700",
                        }}
                    >
                        {item.bestVolume === null
                            ? translate("home.machine.previous.noHistory")
                            : translate("home.machine.recordVolume", {
                                  volume: `${item.bestVolume}`,
                              })}
                    </Text>
                    <View
                        style={{
                            position: "absolute",
                            top: -8,
                            right: -8,
                            width: 44,
                            height: 44,
                            borderRadius: 999,
                            backgroundColor: recordPalette.cardGlow,
                        }}
                    />
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
                        {translate("home.machine.noHistoryCard")}
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
                        {translate("home.machine.recordsTitle")}
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
                                        colors={getChartColors(index, isLatest, t.mode)}
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
    const { t: translate } = useI18n();
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
    const firstName = getFirstName(user?.name, translate("home.greetingFallback"));
    const featuredPlanCopy = getFeaturedPlanCopy(summary.featuredPlanDay, translate);
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
                            {translate("home.header.kicker")}
                        </Text>
                        <Text
                            style={{
                                color: t.textPrimary,
                                fontSize: 28,
                                fontWeight: "900",
                                marginTop: 8,
                            }}
                        >
                            {translate("home.header.greeting", { name: firstName })}
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
                                ? translate("home.header.summaryWithHistory", {
                                      streak: summary.streak,
                                      streakSuffix: summary.streak !== 1 ? "s" : "",
                                      recent: summary.recentWorkoutDays,
                                      recentSuffix: summary.recentWorkoutDays !== 1 ? "s" : "",
                                      activeSuffix: summary.recentWorkoutDays !== 1 ? "s" : "",
                                  })
                                : translate("home.header.summaryWithoutHistory")}
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
                                    {translate("home.header.lastWorkout")}
                                </Text>
                                <Text
                                    style={{
                                        color: t.textPrimary,
                                        fontSize: 22,
                                        fontWeight: "900",
                                        marginTop: 6,
                                    }}
                                >
                                    {summary.lastWorkoutLabel ?? translate("home.header.noRecord")}
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
                                    {translate("home.header.nextTarget")}
                                </Text>
                                <Text
                                    style={{
                                        color: t.textPrimary,
                                        fontSize: 18,
                                        fontWeight: "900",
                                        marginTop: 6,
                                    }}
                                >
                                    {summary.nextPlannedDayLabel ??
                                        translate("home.header.buildWeek")}
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
                                    {translate("home.header.openWeek")}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </AnimatedCard>

            <AnimatedCard index={1}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                    <StatCard
                        index={0}
                        title={translate("home.stats.streakTitle")}
                        value={`${summary.streak}`}
                        hint={translate("home.stats.streakHint", {
                            suffix:
                                summary.streak === 0 ? translate("home.stats.streakHintZero") : "",
                        })}
                        icon="flame-outline"
                    />
                    <StatCard
                        index={1}
                        title={translate("home.stats.last7Title")}
                        value={`${summary.recentWorkoutDays}/7`}
                        hint={translate("home.stats.last7Hint")}
                        icon="pulse-outline"
                    />
                </View>
            </AnimatedCard>

            <AnimatedCard index={2}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                    <StatCard
                        index={1}
                        title={translate("home.stats.monthTitle")}
                        value={`${summary.monthlyWorkoutDays}`}
                        hint={translate("home.stats.monthHint")}
                        icon="barbell-outline"
                    />
                    <StatCard
                        index={2}
                        title={translate("home.stats.weekTitle")}
                        value={`${summary.scheduledDayCount}`}
                        hint={translate("home.stats.weekHint", {
                            count: summary.totalMachinesScheduled,
                            pluralSuffix: summary.totalMachinesScheduled !== 1 ? "s" : "",
                        })}
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
                            ? translate("home.featured.focusCount", {
                                  count: summary.machineProgress.length,
                                  pluralSuffix: summary.machineProgress.length !== 1 ? "s" : "",
                              })
                            : translate("home.featured.noPlannedDays")}
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
                                {translate("home.featured.emptyPanel")}
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
                        {translate("home.rhythm.kicker")}
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
                            ? translate("home.rhythm.titleWithCount", {
                                  count: summary.scheduledDayCount,
                                  daySuffix: summary.scheduledDayCount > 1 ? "s" : "",
                                  builtSuffix: summary.scheduledDayCount > 1 ? "s" : "",
                              })
                            : translate("home.rhythm.titleEmpty")}
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
                            ? translate("home.rhythm.subtitleWithNext", {
                                  next: summary.nextPlannedDayLabel,
                              })
                            : translate("home.rhythm.subtitleEmpty")}
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
                                        {translate("week.machineCount", {
                                            count: day.machineCount,
                                            pluralSuffix: day.machineCount !== 1 ? "s" : "",
                                        })}
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
