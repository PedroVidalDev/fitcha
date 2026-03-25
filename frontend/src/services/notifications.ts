import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const MOTIVATION = [
    "Bora puxar ferro! 💪",
    "Hoje o bicho pega! 🔥",
    "Sem desculpas hoje! 🏋️",
    "A ficha tá te esperando! 📋",
    "Dia de evolução! 📈",
    "Hora de bater recorde! ⚡",
    "O shape não espera! 💥",
];

function getRandomMotivation(): string {
    return MOTIVATION[Math.floor(Math.random() * MOTIVATION.length)];
}

export async function requestNotificationPermission(): Promise<boolean> {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
}

export async function scheduleWeeklyNotifications(
    categoryId: string,
    categoryName: string,
    days: number[],
) {
    await cancelCategoryNotifications(categoryId);

    if (days.length === 0) return;

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    for (const day of days) {
        const weekday = day + 1;

        await Notifications.scheduleNotificationAsync({
            identifier: `category_${categoryId}_day_${day}`,
            content: {
                title: `Hoje é dia de ${categoryName}!`,
                body: getRandomMotivation(),
                sound: "default",
                data: { categoryId },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                weekday,
                hour: 7,
                minute: 0,
            },
        });
    }
}

export async function cancelCategoryNotifications(categoryId: string) {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = all.filter((n) => n.identifier.startsWith(`category_${categoryId}_`));

    for (const notification of toCancel) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
}

export async function cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function listScheduledNotifications() {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`📬 ${all.length} notificações agendadas:`);
    all.forEach((n) => {
        console.log(`  - ${n.identifier}: "${n.content.title}"`);
    });
    return all;
}
