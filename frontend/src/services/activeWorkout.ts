import AsyncStorage from "@react-native-async-storage/async-storage";
import { WorkoutDraftMap } from "../screens/Workout/types";
import { getScopedStorageKey } from "./storage";

const ACTIVE_WORKOUT_KEY = "fitcha_active_workout";

export type ActiveWorkoutSession = {
    dayIndex: number;
    currentIdx: number;
    drafts: WorkoutDraftMap;
    startedAt: number;
    restStartedAt: number | null;
    updatedAt: number;
};

type StoredActiveWorkoutSession = ActiveWorkoutSession & {
    version: 1;
};

function normalizeActiveWorkoutSession(value: unknown): ActiveWorkoutSession | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const candidate = value as Partial<StoredActiveWorkoutSession>;

    if (
        typeof candidate.dayIndex !== "number" ||
        !Number.isFinite(candidate.dayIndex) ||
        candidate.dayIndex < 0 ||
        candidate.dayIndex > 6 ||
        typeof candidate.currentIdx !== "number" ||
        !Number.isFinite(candidate.currentIdx) ||
        candidate.currentIdx < 0 ||
        typeof candidate.startedAt !== "number" ||
        !Number.isFinite(candidate.startedAt) ||
        candidate.startedAt <= 0 ||
        (candidate.restStartedAt !== null &&
            candidate.restStartedAt !== undefined &&
            (typeof candidate.restStartedAt !== "number" ||
                !Number.isFinite(candidate.restStartedAt) ||
                candidate.restStartedAt <= 0)) ||
        typeof candidate.updatedAt !== "number" ||
        !Number.isFinite(candidate.updatedAt) ||
        !candidate.drafts ||
        typeof candidate.drafts !== "object"
    ) {
        return null;
    }

    return {
        dayIndex: candidate.dayIndex,
        currentIdx: candidate.currentIdx,
        drafts: candidate.drafts as WorkoutDraftMap,
        startedAt: candidate.startedAt,
        restStartedAt: candidate.restStartedAt ?? null,
        updatedAt: candidate.updatedAt,
    };
}

async function getStorageKey() {
    return getScopedStorageKey(ACTIVE_WORKOUT_KEY);
}

export async function getActiveWorkoutSession() {
    const key = await getStorageKey();
    const raw = await AsyncStorage.getItem(key);

    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw) as unknown;
        const normalized = normalizeActiveWorkoutSession(parsed);

        if (!normalized) {
            await AsyncStorage.removeItem(key);
            return null;
        }

        return normalized;
    } catch {
        await AsyncStorage.removeItem(key);
        return null;
    }
}

export async function saveActiveWorkoutSession(session: Omit<ActiveWorkoutSession, "updatedAt">) {
    const key = await getStorageKey();
    const payload: StoredActiveWorkoutSession = {
        version: 1,
        ...session,
        updatedAt: Date.now(),
    };

    await AsyncStorage.setItem(key, JSON.stringify(payload));
}

export async function clearActiveWorkoutSession() {
    const key = await getStorageKey();
    await AsyncStorage.removeItem(key);
}
