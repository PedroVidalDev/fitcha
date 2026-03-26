import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const NOTIF_KEY = "fitcha_notifications_scheduled";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function requestNotificationPermission(): Promise<boolean> {
    if (!Device.isDevice) {
        console.log("Notificações não funcionam no emulador");
        return false;
    }

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("treino", {
            name: "Lembretes de treino",
            importance: Notifications.AndroidImportance.HIGH,
            sound: "default",
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#F4A261",
        });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === "granted";
}

const MESSAGES = [
    { title: "Bora treinar! 💪", body: "Hoje é dia de {categories}. Não deixa pra amanhã!" },
    { title: "Hora do ferro! 🏋️", body: "Seu treino de {categories} tá te esperando." },
    { title: "Tá na hora! ⚡", body: "Dia de {categories}. Bora meter carga!" },
    { title: "Treino do dia 🔥", body: "{categories} no cardápio de hoje. Cola na academia!" },
    { title: "Não fura o treino! 💪", body: "Hoje tem {categories}. Seu corpo agradece." },
];

function getRandomMessage(categories: string): { title: string; body: string } {
    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    return {
        title: msg.title,
        body: msg.body.replace("{categories}", categories),
    };
}

export async function scheduleWeeklyNotifications(
    daysWithCategories: Record<number, string[]>,
) {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    const scheduledDays: number[] = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const categories = daysWithCategories[dayIndex];
        if (!categories || categories.length === 0) continue;

        const categoryText = categories.join(", ");
        const { title, body } = getRandomMessage(categoryText);

        // Agenda repetição semanal — dispara todo [dayIndex] às 7h
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: "default",
                ...(Platform.OS === "android" && { channelId: "treino" }),
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                weekday: dayIndex === 0 ? 1 : dayIndex + 1,
                hour: 7,
                minute: 0,
            },
        });

        scheduledDays.push(dayIndex);
    }

    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(scheduledDays));
}

export async function syncNotifications(
    days: Record<number, { categoryKey: string }[]>,
    getCategoryLabel: (key: string) => string,
) {
    const daysWithCategories: Record<number, string[]> = {};

    for (let i = 0; i < 7; i++) {
        const machines = days[i] ?? [];
        if (machines.length === 0) continue;

        const uniqueCategories = [...new Set(machines.map((m) => getCategoryLabel(m.categoryKey)))];
        daysWithCategories[i] = uniqueCategories;
    }

    await scheduleWeeklyNotifications(daysWithCategories);
}
