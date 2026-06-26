import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { translateRuntime } from '../translates/runtime'

const NOTIF_KEY = 'fitcha_notifications_scheduled'

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
})

export async function requestNotificationPermission(): Promise<boolean> {
    if (!Device.isDevice) {
        console.log(translateRuntime('notifications.emulatorUnsupported'))
        return false
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('treino', {
            name: translateRuntime('notifications.channelName'),
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#F4A261',
        })
    }

    const { status: existing } = await Notifications.getPermissionsAsync()
    let finalStatus = existing

    if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
    }

    return finalStatus === 'granted'
}

function buildMessages() {
    return [
        {
            title: translateRuntime('notifications.message1.title'),
            body: translateRuntime('notifications.message1.body'),
        },
        {
            title: translateRuntime('notifications.message2.title'),
            body: translateRuntime('notifications.message2.body'),
        },
        {
            title: translateRuntime('notifications.message3.title'),
            body: translateRuntime('notifications.message3.body'),
        },
        {
            title: translateRuntime('notifications.message4.title'),
            body: translateRuntime('notifications.message4.body'),
        },
        {
            title: translateRuntime('notifications.message5.title'),
            body: translateRuntime('notifications.message5.body'),
        },
    ]
}

function getRandomMessage(categories: string): { title: string; body: string } {
    const messages = buildMessages()
    const msg = messages[Math.floor(Math.random() * messages.length)]
    return {
        title: msg.title,
        body: msg.body.replace('{categories}', categories),
    }
}

export async function scheduleWeeklyNotifications(
    daysWithCategories: Record<number, string[]>,
) {
    await Notifications.cancelAllScheduledNotificationsAsync()

    const hasPermission = await requestNotificationPermission()
    if (!hasPermission) return

    const scheduledDays: number[] = []

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const categories = daysWithCategories[dayIndex]
        if (!categories || categories.length === 0) continue

        const categoryText = categories.join(', ')
        const { title, body } = getRandomMessage(categoryText)

        // Agenda repetição semanal — dispara todo [dayIndex] às 7h
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: 'default',
                ...(Platform.OS === 'android' && { channelId: 'treino' }),
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                weekday: dayIndex === 0 ? 1 : dayIndex + 1,
                hour: 7,
                minute: 0,
            },
        })

        scheduledDays.push(dayIndex)
    }

    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(scheduledDays))
}

export async function syncNotifications(
    days: Record<number, { categoryKey: string }[]>,
    getCategoryLabel: (key: string) => string,
) {
    const daysWithCategories: Record<number, string[]> = {}

    for (let i = 0; i < 7; i++) {
        const machines = days[i] ?? []
        if (machines.length === 0) continue

        const uniqueCategories = [
            ...new Set(machines.map((m) => getCategoryLabel(m.categoryKey))),
        ]
        daysWithCategories[i] = uniqueCategories
    }

    await scheduleWeeklyNotifications(daysWithCategories)
}

export async function clearScheduledNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync()
    await AsyncStorage.removeItem(NOTIF_KEY)
}
