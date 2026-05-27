import { useDayMachines } from "@/src/hooks/useDayMachines";
import { useSaveWorkout } from "@/src/screens/Workout/hooks/useSaveWorkout";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Animated as RNAnimated,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { CategoryBadge } from "../../components/CategoryBadge";
import { ConfirmModal } from "../../components/ConfirmModal";
import { useI18n } from "../../contexts/I18nContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
    clearActiveWorkoutSession,
    getActiveWorkoutSession,
    saveActiveWorkoutSession,
} from "../../services/activeWorkout";
import {
    buildWorkoutResults,
    formatTime,
    getWorkoutDraft,
    hasDraftValue,
    isDraftComplete,
    parseReps,
    parseWeight,
} from "./helpers";
import {
    Route,
    WorkoutDraft,
    WorkoutDraftFieldKey,
    WorkoutDraftMap,
    WorkoutModalConfig,
    WorkoutResult,
    WorkoutSetKey,
    WORKOUT_SET_KEYS,
} from "./types";

export default function WorkoutScreen() {
    const { t } = useTheme();
    const { t: translate } = useI18n();

    const navigation = useNavigation();
    const route = useRoute<Route>();
    const day = route.params.dayIndex;

    const { machines, refresh } = useDayMachines(day);
    const saveWorkout = useSaveWorkout();

    const [currentIdx, setCurrentIdx] = useState(0);
    const [drafts, setDrafts] = useState<WorkoutDraftMap>({});
    const [startedAt, setStartedAt] = useState(() => Date.now());
    const [elapsed, setElapsed] = useState(0);
    const [restStartedAt, setRestStartedAt] = useState<number | null>(null);
    const [restElapsed, setRestElapsed] = useState(0);
    const [modal, setModal] = useState<WorkoutModalConfig | null>(null);
    const [isSessionReady, setIsSessionReady] = useState(!route.params.resume);
    const machineNavScrollRef = useRef<ScrollView>(null);

    const machine = machines[currentIdx];
    const isLast = currentIdx === machines.length - 1;
    const canGoPrev = currentIdx > 0;
    const canGoNext = currentIdx < machines.length - 1;
    const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";
    const currentDraft = machine ? getWorkoutDraft(drafts[machine.id]) : getWorkoutDraft();
    const completedCount = machines.filter((item) => isDraftComplete(drafts[item.id])).length;
    const pendingCount = machines.length - completedCount;
    const hasAnyDrafts = machines.some((item) => hasDraftValue(drafts[item.id]));
    const currentHasDraft = hasDraftValue(currentDraft);
    const currentIsComplete = isDraftComplete(currentDraft);

    const openModal = (config: WorkoutModalConfig) => {
        setModal(config);
    };

    const closeModal = () => {
        setModal(null);
    };

    const handleModalConfirm = () => {
        const action = modal?.onConfirm;
        closeModal();
        action?.();
    };

    const clearAndExitWorkout = useCallback(async () => {
        await clearActiveWorkoutSession();
        navigation.goBack();
    }, [navigation]);

    const isValidWeightValue = (value: string) => {
        const parsed = parseWeight(value);
        return !Number.isNaN(parsed) && parsed > 0;
    };

    const isValidRepsValue = (value: string) => {
        const parsed = parseReps(value);
        return !Number.isNaN(parsed) && parsed > 0;
    };

    const updateDraftField = (
        field: WorkoutSetKey,
        draftField: WorkoutDraftFieldKey,
        value: string,
    ) => {
        if (!machine) return;

        setDrafts((prev) => ({
            ...prev,
            [machine.id]: {
                ...getWorkoutDraft(prev[machine.id]),
                sets: {
                    ...getWorkoutDraft(prev[machine.id]).sets,
                    [field]: {
                        ...getWorkoutDraft(prev[machine.id]).sets[field],
                        [draftField]: value,
                    },
                },
                confirmed: {
                    ...getWorkoutDraft(prev[machine.id]).confirmed,
                    ...Object.fromEntries(
                        WORKOUT_SET_KEYS.slice(WORKOUT_SET_KEYS.indexOf(field)).map((key) => [
                            key,
                            false,
                        ]),
                    ),
                },
            },
        }));
    };

    const confirmDraftField = (field: WorkoutSetKey) => {
        if (!machine) return;

        const currentSet = currentDraft.sets[field];

        if (!isValidWeightValue(currentSet.weight) || !isValidRepsValue(currentSet.reps)) return;

        const fieldIndex = WORKOUT_SET_KEYS.indexOf(field);
        const previousFields = WORKOUT_SET_KEYS.slice(0, fieldIndex);
        const canConfirm = previousFields.every((key) => currentDraft.confirmed[key]);

        if (!canConfirm) return;

        const normalizedSet = {
            weight: currentSet.weight.trim(),
            reps: currentSet.reps.trim(),
        };

        setDrafts((prev) => ({
            ...prev,
            [machine.id]: {
                ...getWorkoutDraft(prev[machine.id]),
                sets: {
                    ...getWorkoutDraft(prev[machine.id]).sets,
                    [field]: normalizedSet,
                },
                confirmed: {
                    ...getWorkoutDraft(prev[machine.id]).confirmed,
                    [field]: true,
                },
            },
        }));

        setRestStartedAt(Date.now());
        setRestElapsed(0);
    };

    const goToMachine = (idx: number) => {
        if (idx < 0 || idx >= machines.length || idx === currentIdx) return;
        setCurrentIdx(idx);
    };

    const goToPreviousMachine = () => {
        if (!canGoPrev) return;
        setCurrentIdx((prev) => prev - 1);
    };

    const goToNextMachine = () => {
        if (!canGoNext) return;
        setCurrentIdx((prev) => prev + 1);
    };

    const buildResults = (): WorkoutResult[] =>
        buildWorkoutResults(
            machines.map((item) => item.id),
            drafts,
        );

    const showSavedWorkoutModal = (finalResults: WorkoutResult[]) => {
        openModal({
            title: translate("workout.saved.title"),
            message: translate("workout.saved.message", {
                count: finalResults.length,
                machineSuffix: finalResults.length > 1 ? "s" : "",
                registeredSuffix: finalResults.length > 1 ? "s" : "",
                elapsed: formatTime(elapsed),
            }),
            confirmLabel: translate("common.actions.close"),
            hideCancel: true,
            confirmVariant: "accent",
            onConfirm: () => navigation.goBack(),
        });
    };

    const showEmptyWorkoutModal = () => {
        openModal({
            title: translate("workout.empty.title"),
            message: translate("workout.empty.message"),
            confirmLabel: translate("common.actions.close"),
            hideCancel: true,
            confirmVariant: "accent",
            onConfirm: () => {
                void clearAndExitWorkout();
            },
        });
    };

    const showSaveErrorModal = () => {
        openModal({
            title: translate("workout.error.title"),
            message: translate("workout.error.message"),
            confirmLabel: translate("common.actions.close"),
            hideCancel: true,
            confirmVariant: "accent",
            onConfirm: () => {},
        });
    };

    const finishWorkout = async (finalResults: WorkoutResult[]) => {
        if (finalResults.length === 0) {
            showEmptyWorkoutModal();
            return;
        }

        try {
            await saveWorkout(finalResults);
            await clearActiveWorkoutSession();
            showSavedWorkoutModal(finalResults);
        } catch {
            showSaveErrorModal();
        }
    };

    const handleFinish = () => {
        const finalResults = buildResults();

        if (finalResults.length === 0 && hasAnyDrafts) {
            openModal({
                title: translate("workout.incomplete.title"),
                message: translate("workout.incomplete.message"),
                confirmLabel: translate("workout.incomplete.confirm"),
                confirmVariant: "danger",
                onConfirm: () => {
                    void clearAndExitWorkout();
                },
            });
            return;
        }

        if (pendingCount > 0 && finalResults.length > 0) {
            openModal({
                title: translate("workout.pending.title"),
                message: translate("workout.pending.message", {
                    count: pendingCount,
                    machineSuffix: pendingCount > 1 ? "s ficaram" : " ficou",
                }),
                confirmLabel: translate("common.actions.finish"),
                confirmVariant: "accent",
                onConfirm: () => {
                    void finishWorkout(finalResults);
                },
            });
            return;
        }

        void finishWorkout(finalResults);
    };

    const handleNext = () => {
        if (isLast) {
            handleFinish();
            return;
        }

        goToNextMachine();
    };

    const handleQuit = () => {
        openModal({
            title: translate("workout.quit.title"),
            message: translate("workout.quit.message"),
            confirmLabel: translate("workout.quit.confirm"),
            confirmVariant: "danger",
            onConfirm: () => {
                void clearAndExitWorkout();
            },
        });
    };

    useEffect(() => {
        let isCancelled = false;

        const hydrateSession = async () => {
            if (!route.params.resume) {
                setCurrentIdx(0);
                setDrafts({});
                setStartedAt(Date.now());
                setRestStartedAt(null);
                setRestElapsed(0);
                setIsSessionReady(true);
                return;
            }

            const session = await getActiveWorkoutSession();
            if (isCancelled) return;

            if (session && session.dayIndex === day) {
                setCurrentIdx(session.currentIdx);
                setDrafts(session.drafts);
                setStartedAt(session.startedAt);
                setRestStartedAt(session.restStartedAt);
                setRestElapsed(0);
            } else {
                setCurrentIdx(0);
                setDrafts({});
                setStartedAt(Date.now());
                setRestStartedAt(null);
                setRestElapsed(0);
            }

            setIsSessionReady(true);
        };

        void hydrateSession();

        return () => {
            isCancelled = true;
        };
    }, [day, route.params.resume]);

    useEffect(() => {
        if (!isSessionReady) return;

        void saveActiveWorkoutSession({
            dayIndex: day,
            currentIdx,
            drafts,
            startedAt,
            restStartedAt,
        });
    }, [currentIdx, day, drafts, isSessionReady, restStartedAt, startedAt]);

    useEffect(() => {
        const syncTimers = () => {
            setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));

            if (!restStartedAt) {
                setRestElapsed(0);
                return;
            }

            setRestElapsed(Math.floor((Date.now() - restStartedAt) / 1000));
        };

        syncTimers();
        const interval = setInterval(syncTimers, 1000);

        return () => clearInterval(interval);
    }, [restStartedAt, startedAt]);

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
    }, [currentIdx, fadeAnim, slideAnim]);

    useEffect(() => {
        if (machines.length === 0) return;
        if (currentIdx >= machines.length) {
            setCurrentIdx(machines.length - 1);
        }
    }, [currentIdx, machines.length]);

    useEffect(() => {
        machineNavScrollRef.current?.scrollTo({
            x: Math.max(currentIdx * 72 - 72, 0),
            animated: true,
        });
    }, [currentIdx]);

    useFocusEffect(
        useCallback(() => {
            void refresh();
        }, [refresh]),
    );

    if (!isSessionReady) {
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

    if (!machine) return null;

    const seriesFields = [
        {
            key: "set1" as const,
            label: translate("workout.series.one"),
            weightValue: currentDraft.sets.set1.weight,
            repsValue: currentDraft.sets.set1.reps,
            weightPlaceholder: machine.recordSets?.[0]?.weight?.toString() ?? "",
            repsPlaceholder:
                machine.recordSets?.[0]?.reps && machine.recordSets[0].reps > 0
                    ? machine.recordSets[0].reps.toString()
                    : "",
        },
        {
            key: "set2" as const,
            label: translate("workout.series.two"),
            weightValue: currentDraft.sets.set2.weight,
            repsValue: currentDraft.sets.set2.reps,
            weightPlaceholder: machine.recordSets?.[1]?.weight?.toString() ?? "",
            repsPlaceholder:
                machine.recordSets?.[1]?.reps && machine.recordSets[1].reps > 0
                    ? machine.recordSets[1].reps.toString()
                    : "",
        },
        {
            key: "set3" as const,
            label: translate("workout.series.three"),
            weightValue: currentDraft.sets.set3.weight,
            repsValue: currentDraft.sets.set3.reps,
            weightPlaceholder: machine.recordSets?.[2]?.weight?.toString() ?? "",
            repsPlaceholder:
                machine.recordSets?.[2]?.reps && machine.recordSets[2].reps > 0
                    ? machine.recordSets[2].reps.toString()
                    : "",
        },
    ].map((item, idx, allFields) => {
        const previousSetsComplete =
            idx === 0 ||
            allFields.slice(0, idx).every((field) => currentDraft.confirmed[field.key]);
        const isConfirmed = currentDraft.confirmed[item.key];
        const isWeightValid = isValidWeightValue(item.weightValue);
        const isRepsValid = isValidRepsValue(item.repsValue);

        return {
            ...item,
            isConfirmed,
            isWeightValid,
            isRepsValid,
            isLocked: !previousSetsComplete,
            canConfirm: previousSetsComplete && isWeightValid && isRepsValid && !isConfirmed,
        };
    });

    const hasLockedSeries = seriesFields.slice(1).some((item) => item.isLocked);

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
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
                        {translate("workout.position", {
                            current: currentIdx + 1,
                            total: machines.length,
                        })}
                    </Text>
                    <Text
                        style={{
                            color: t.textMuted,
                            fontSize: 11,
                            fontWeight: "700",
                            marginTop: 4,
                        }}
                    >
                        {translate("workout.completedProgress", {
                            completed: completedCount,
                            total: machines.length,
                        })}
                    </Text>
                </View>

                <View style={{ width: 34 }} />
            </LinearGradient>

            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, gap: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={goToPreviousMachine}
                        disabled={!canGoPrev}
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: t.inputBg,
                            borderWidth: 0.5,
                            borderColor: t.border,
                            opacity: canGoPrev ? 1 : 0.4,
                        }}
                    >
                        <Ionicons name="chevron-back" size={20} color={t.textPrimary} />
                    </TouchableOpacity>

                    <ScrollView
                        ref={machineNavScrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8, paddingRight: 4 }}
                        style={{ flex: 1 }}
                    >
                        {machines.map((item, idx) => {
                            const isCurrent = idx === currentIdx;
                            const hasDraft = hasDraftValue(drafts[item.id]);
                            const isComplete = isDraftComplete(drafts[item.id]);

                            const chipBackgroundColor = isCurrent
                                ? t.accent
                                : isComplete
                                  ? t.accent + "18"
                                  : hasDraft
                                    ? t.chipBg
                                    : t.inputBg;
                            const chipBorderColor = isCurrent
                                ? t.accent
                                : isComplete
                                  ? t.accent + "70"
                                  : hasDraft
                                    ? t.accentDark + "70"
                                    : t.border;
                            const chipTextColor = isCurrent ? btnColor : t.textPrimary;
                            const statusIconName = isComplete
                                ? "checkmark-circle"
                                : hasDraft
                                  ? "ellipse"
                                  : "ellipse-outline";
                            const statusIconColor = isCurrent
                                ? btnColor
                                : isComplete
                                  ? t.accent
                                  : hasDraft
                                    ? t.accentDark
                                    : t.textDim;

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    activeOpacity={0.8}
                                    onPress={() => goToMachine(idx)}
                                    style={{ minWidth: 60 }}
                                >
                                    <View
                                        style={{
                                            minHeight: 44,
                                            borderRadius: 16,
                                            paddingHorizontal: 12,
                                            paddingVertical: 10,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: chipBackgroundColor,
                                            borderWidth: 1,
                                            borderColor: chipBorderColor,
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 6,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: chipTextColor,
                                                    fontSize: 14,
                                                    fontWeight: "900",
                                                }}
                                            >
                                                {idx + 1}
                                            </Text>
                                            <Ionicons
                                                name={statusIconName}
                                                size={14}
                                                color={statusIconColor}
                                            />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={goToNextMachine}
                        disabled={!canGoNext}
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: t.inputBg,
                            borderWidth: 0.5,
                            borderColor: t.border,
                            opacity: canGoNext ? 1 : 0.4,
                        }}
                    >
                        <Ionicons name="chevron-forward" size={20} color={t.textPrimary} />
                    </TouchableOpacity>
                </View>

                <Text
                    style={{
                        color: t.textDim,
                        fontSize: 12,
                        lineHeight: 18,
                    }}
                >
                    {translate("workout.swapHint")}
                </Text>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <RNAnimated.View
                    style={{
                        padding: 20,
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }}
                >
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

                    <View
                        style={{
                            backgroundColor: t.inputBg,
                            borderRadius: 14,
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                            borderWidth: 0.5,
                            borderColor: t.border,
                            marginBottom: 18,
                        }}
                    >
                        <Text
                            style={{
                                color: currentIsComplete ? t.accent : t.textMuted,
                                fontSize: 13,
                                fontWeight: "800",
                                marginBottom: 4,
                            }}
                        >
                            {currentIsComplete
                                ? translate("workout.status.registeredTitle")
                                : currentHasDraft
                                  ? translate("workout.status.draftTitle")
                                  : translate("workout.status.skipTitle")}
                        </Text>
                        <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 18 }}>
                            {currentIsComplete
                                ? translate("workout.status.registeredMessage")
                                : currentHasDraft
                                  ? translate("workout.status.draftMessage")
                                  : translate("workout.status.skipMessage")}
                        </Text>
                    </View>

                    <View
                        style={{
                            backgroundColor: restStartedAt ? t.chipBg : t.inputBg,
                            borderRadius: 14,
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                            borderWidth: 0.5,
                            borderColor: restStartedAt ? t.accent + "55" : t.border,
                            marginBottom: 18,
                            gap: 6,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                            }}
                        >
                            <Text
                                style={{
                                    color: t.textMuted,
                                    fontSize: 12,
                                    fontWeight: "800",
                                    textTransform: "uppercase",
                                    letterSpacing: 1.4,
                                }}
                            >
                                {translate("workout.rest.title")}
                            </Text>
                            <Text
                                style={{
                                    color: restStartedAt ? t.accent : t.textPrimary,
                                    fontSize: 24,
                                    fontWeight: "900",
                                    fontVariant: ["tabular-nums"],
                                }}
                            >
                                {restStartedAt ? formatTime(restElapsed) : "--:--"}
                            </Text>
                        </View>
                        <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 18 }}>
                            {translate(restStartedAt ? "workout.rest.active" : "workout.rest.idle")}
                        </Text>
                    </View>

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
                        {translate("workout.fillSeries")}
                    </Text>

                    <View style={{ gap: 10 }}>
                        {seriesFields.map((item) => (
                            <View
                                key={`${machine.id}-${item.key}`}
                                style={{
                                    gap: 12,
                                    backgroundColor: item.isLocked ? t.card : t.inputBg,
                                    borderRadius: 14,
                                    paddingHorizontal: 16,
                                    paddingVertical: 14,
                                    borderWidth: 0.5,
                                    borderColor: t.border,
                                    opacity: item.isLocked ? 0.55 : 1,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 12,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: t.textDim,
                                            fontSize: 13,
                                            fontWeight: "700",
                                        }}
                                    >
                                        {item.label}
                                    </Text>

                                    <View
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                    >
                                        <Ionicons
                                            name={
                                                item.isConfirmed
                                                    ? "checkmark-circle"
                                                    : item.isLocked
                                                      ? "lock-closed"
                                                      : "ellipse-outline"
                                            }
                                            size={14}
                                            color={
                                                item.isConfirmed
                                                    ? t.accent
                                                    : item.isLocked
                                                      ? t.textDim
                                                      : t.textMuted
                                            }
                                        />
                                        <Text
                                            style={{
                                                color: item.isConfirmed ? t.accent : t.textMuted,
                                                fontSize: 12,
                                                fontWeight: "700",
                                            }}
                                        >
                                            {translate(
                                                item.isConfirmed
                                                    ? "workout.series.confirmedState"
                                                    : item.isLocked
                                                      ? "workout.series.lockedState"
                                                      : "workout.series.readyState",
                                            )}
                                        </Text>
                                    </View>
                                </View>

                                <View
                                    style={{
                                        flexDirection: "row",
                                        gap: 10,
                                    }}
                                >
                                    <View style={{ flex: 1, gap: 8 }}>
                                        <Text
                                            style={{
                                                color: t.textDim,
                                                fontSize: 11,
                                                fontWeight: "700",
                                                textTransform: "uppercase",
                                                letterSpacing: 1,
                                            }}
                                        >
                                            {translate("workout.series.weightLabel")}
                                        </Text>
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: 8,
                                            }}
                                        >
                                            <TextInput
                                                style={{
                                                    flex: 1,
                                                    paddingHorizontal: 14,
                                                    paddingVertical: 14,
                                                    borderRadius: 12,
                                                    backgroundColor: t.bg,
                                                    color: t.textPrimary,
                                                    fontSize: 20,
                                                    fontWeight: "800",
                                                    textAlign: "center",
                                                    borderWidth: 0.5,
                                                    borderColor: item.isConfirmed
                                                        ? t.accent + "55"
                                                        : t.border,
                                                }}
                                                placeholder={item.weightPlaceholder}
                                                placeholderTextColor={t.textDim}
                                                keyboardType="numeric"
                                                value={item.weightValue}
                                                editable={!item.isLocked}
                                                onChangeText={(value) =>
                                                    updateDraftField(item.key, "weight", value)
                                                }
                                            />
                                            <Text
                                                style={{
                                                    color: t.textMuted,
                                                    fontSize: 14,
                                                    fontWeight: "600",
                                                }}
                                            >
                                                {translate("common.units.kg")}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={{ width: 116, gap: 8 }}>
                                        <Text
                                            style={{
                                                color: t.textDim,
                                                fontSize: 11,
                                                fontWeight: "700",
                                                textTransform: "uppercase",
                                                letterSpacing: 1,
                                            }}
                                        >
                                            {translate("workout.series.repsLabel")}
                                        </Text>
                                        <TextInput
                                            style={{
                                                paddingHorizontal: 14,
                                                paddingVertical: 14,
                                                borderRadius: 12,
                                                backgroundColor: t.bg,
                                                color: t.textPrimary,
                                                fontSize: 20,
                                                fontWeight: "800",
                                                textAlign: "center",
                                                borderWidth: 0.5,
                                                borderColor: item.isConfirmed
                                                    ? t.accent + "55"
                                                    : t.border,
                                            }}
                                            placeholder={item.repsPlaceholder}
                                            placeholderTextColor={t.textDim}
                                            keyboardType="numeric"
                                            value={item.repsValue}
                                            editable={!item.isLocked}
                                            onChangeText={(value) =>
                                                updateDraftField(item.key, "reps", value)
                                            }
                                        />
                                    </View>
                                </View>

                                <View>
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        disabled={!item.canConfirm}
                                        onPress={() => confirmDraftField(item.key)}
                                        style={{
                                            borderRadius: 12,
                                            opacity: item.canConfirm || item.isConfirmed ? 1 : 0.45,
                                        }}
                                    >
                                        <LinearGradient
                                            colors={
                                                item.isConfirmed
                                                    ? [t.accent + "26", t.accent + "12"]
                                                    : item.canConfirm
                                                      ? t.gradientAccent
                                                      : [t.card, t.card]
                                            }
                                            style={{
                                                width: "100%",
                                                paddingHorizontal: 14,
                                                paddingVertical: 12,
                                                borderRadius: 12,
                                                borderWidth: item.isConfirmed ? 0.5 : 0,
                                                borderColor: item.isConfirmed
                                                    ? t.accent + "55"
                                                    : "transparent",
                                                flexDirection: "row",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 8,
                                            }}
                                        >
                                            <Ionicons
                                                name={
                                                    item.isConfirmed
                                                        ? "checkmark-circle"
                                                        : "checkmark-outline"
                                                }
                                                size={16}
                                                color={
                                                    item.isConfirmed
                                                        ? t.accent
                                                        : item.canConfirm
                                                          ? btnColor
                                                          : t.textDim
                                                }
                                            />
                                            <Text
                                                style={{
                                                    color: item.isConfirmed
                                                        ? t.accent
                                                        : item.canConfirm
                                                          ? btnColor
                                                          : t.textDim,
                                                    fontSize: 13,
                                                    fontWeight: "800",
                                                }}
                                            >
                                                {translate(
                                                    item.isConfirmed
                                                        ? "workout.series.confirmedCta"
                                                        : "workout.series.confirmCta",
                                                )}
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>

                    {hasLockedSeries ? (
                        <Text
                            style={{
                                color: t.textDim,
                                fontSize: 12,
                                lineHeight: 18,
                                marginTop: 10,
                                marginLeft: 4,
                            }}
                        >
                            {translate("workout.series.lockedHint")}
                        </Text>
                    ) : null}

                    <View style={{ paddingTop: 28, paddingBottom: 20 }}>
                        <View style={{ flexDirection: "row", gap: 12 }}>
                            <TouchableOpacity
                                activeOpacity={0.75}
                                onPress={() => goToMachine(currentIdx - 1)}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    paddingVertical: 16,
                                    paddingHorizontal: 18,
                                    borderRadius: 16,
                                    backgroundColor: t.inputBg,
                                    borderWidth: 0.5,
                                    borderColor: t.border,
                                    flex: 0.95,
                                    opacity: currentIdx === 0 ? 0.45 : 1,
                                }}
                                disabled={currentIdx === 0}
                            >
                                <Ionicons
                                    name="arrow-back-circle-outline"
                                    size={20}
                                    color={t.textMuted}
                                />
                                <Text
                                    style={{ color: t.textMuted, fontSize: 16, fontWeight: "800" }}
                                >
                                    {translate("common.actions.back")}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.75}
                                onPress={handleNext}
                                style={{ flex: 1.4 }}
                            >
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
                                        name={
                                            isLast
                                                ? "checkmark-done-circle"
                                                : "arrow-forward-circle"
                                        }
                                        size={22}
                                        color={btnColor}
                                    />
                                    <Text
                                        style={{ color: btnColor, fontSize: 17, fontWeight: "900" }}
                                    >
                                        {isLast
                                            ? translate("common.actions.finishWorkout")
                                            : translate("workout.nextMachine")}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </RNAnimated.View>
            </ScrollView>

            <ConfirmModal
                visible={!!modal}
                title={modal?.title ?? ""}
                message={modal?.message ?? ""}
                confirmLabel={modal?.confirmLabel}
                cancelLabel={modal?.cancelLabel}
                hideCancel={modal?.hideCancel}
                confirmVariant={modal?.confirmVariant}
                onClose={closeModal}
                onConfirm={handleModalConfirm}
            />
        </View>
    );
}
