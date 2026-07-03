import { Ionicons } from '@expo/vector-icons'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Linking,
    TouchableOpacity,
    View,
} from 'react-native'

import { ConfirmModal } from '../components/ConfirmModal'
import { ProfileShortcutButton } from '../components/ProfileShortcutButton'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { useTheme } from '../contexts/ThemeContext'
import { getInstalledAppVersion } from '../services/appRelease'
import {
    applyOtaUpdate,
    AvailableAppUpdate,
    resolveAvailableAppUpdate,
} from '../services/appUpdate'

import DayScreen from '../screens/Day'
import HomeScreen from '../screens/Home'
import LoginScreen from '../screens/Login'
import ProfileScreen from '../screens/Profile'
import RegisterScreen from '../screens/Register'
import WeekScreen from '../screens/Week'
import WorkoutScreen from '../screens/Workout'

import MachineDetailScreen from '../screens/Detail'
import { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function AppNavigator() {
    const {
        user,
        isLoading,
        logout,
        isSessionExpiredNoticeVisible,
        dismissSessionExpiredNotice,
    } = useAuth()
    const { t, toggle } = useTheme()
    const { t: translate } = useI18n()
    const [availableUpdate, setAvailableUpdate] =
        useState<AvailableAppUpdate | null>(null)
    const [isApplyingUpdate, setIsApplyingUpdate] = useState(false)
    const currentVersion = getInstalledAppVersion()

    useEffect(() => {
        let isMounted = true

        const checkForAppUpdate = async () => {
            try {
                const nextUpdate = await resolveAvailableAppUpdate()
                if (!isMounted) return

                setAvailableUpdate(nextUpdate)
            } catch {
                if (!isMounted) return
                setAvailableUpdate(null)
            }
        }

        void checkForAppUpdate()

        return () => {
            isMounted = false
        }
    }, [currentVersion])

    const isUpdateRequired =
        availableUpdate?.kind === 'native' && availableUpdate.required

    const closeAvailableUpdate = () => {
        if (isUpdateRequired || isApplyingUpdate) return
        setAvailableUpdate(null)
    }

    const handleConfirmUpdate = async () => {
        if (!availableUpdate || isApplyingUpdate) return

        if (availableUpdate.kind === 'ota') {
            try {
                setIsApplyingUpdate(true)
                const didApplyUpdate = await applyOtaUpdate()
                if (!didApplyUpdate) {
                    setAvailableUpdate(null)
                }
            } catch (error) {
                Alert.alert(
                    translate('appUpdate.errorTitle'),
                    translate('appUpdate.otaErrorMessage'),
                )
                console.warn(
                    'Nao foi possivel aplicar a atualizacao OTA.',
                    error,
                )
            } finally {
                setIsApplyingUpdate(false)
            }

            return
        }

        if (!availableUpdate.release.releaseUrl) return

        try {
            await Linking.openURL(availableUpdate.release.releaseUrl)
            if (!availableUpdate.required) {
                setAvailableUpdate(null)
            }
        } catch (error) {
            console.warn('Nao foi possivel abrir a pagina de release.', error)
        }
    }

    const updateNoticeModal = (
        <ConfirmModal
            visible={!!availableUpdate}
            title={translate(
                availableUpdate?.kind === 'ota'
                    ? 'appUpdate.otaTitle'
                    : 'appUpdate.title',
            )}
            message={
                availableUpdate?.kind === 'ota'
                    ? translate('appUpdate.otaMessage')
                    : translate(
                          isUpdateRequired
                              ? 'appUpdate.requiredMessage'
                              : 'appUpdate.message',
                          {
                              latestVersion:
                                  availableUpdate?.kind === 'native'
                                      ? availableUpdate.release.latestVersion
                                      : currentVersion,
                              currentVersion,
                          },
                      )
            }
            confirmLabel={translate(
                availableUpdate?.kind === 'ota' && isApplyingUpdate
                    ? 'appUpdate.otaApplying'
                    : availableUpdate?.kind === 'ota'
                      ? 'appUpdate.otaConfirm'
                      : 'appUpdate.confirm',
            )}
            cancelLabel={translate('appUpdate.cancel')}
            hideCancel={isUpdateRequired}
            isBusy={isApplyingUpdate}
            confirmVariant='accent'
            onClose={closeAvailableUpdate}
            onConfirm={() => void handleConfirmUpdate()}
        />
    )

    if (isLoading) {
        return (
            <>
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: t.bg,
                    }}
                >
                    <ActivityIndicator size='large' color={t.accent} />
                </View>

                {updateNoticeModal}
            </>
        )
    }

    const ThemeToggle = () => (
        <TouchableOpacity onPress={toggle} style={{ padding: 6 }}>
            <Ionicons
                name={t.mode === 'dark' ? 'sunny' : 'moon'}
                size={22}
                color={t.accent}
            />
        </TouchableOpacity>
    )

    const HeaderActions = ({
        showLogout = false,
    }: {
        showLogout?: boolean
    }) => (
        <View
            style={{
                flexDirection: 'row',
                gap: 10,
                alignItems: 'center',
            }}
        >
            <ThemeToggle />
            {showLogout && (
                <TouchableOpacity onPress={logout} style={{ padding: 6 }}>
                    <Ionicons
                        name='log-out-outline'
                        size={22}
                        color={t.textMuted}
                    />
                </TouchableOpacity>
            )}
            <ProfileShortcutButton />
        </View>
    )

    return (
        <>
            <NavigationContainer
                theme={{
                    dark: t.mode === 'dark',
                    colors: {
                        primary: t.accent,
                        background: t.bg,
                        card: t.headerBg,
                        text: t.textPrimary,
                        border: t.border,
                        notification: t.accent,
                    },
                    fonts: {
                        regular: { fontFamily: 'System', fontWeight: '400' },
                        medium: { fontFamily: 'System', fontWeight: '500' },
                        bold: { fontFamily: 'System', fontWeight: '700' },
                        heavy: { fontFamily: 'System', fontWeight: '900' },
                    },
                }}
            >
                <Stack.Navigator
                    screenOptions={{
                        headerStyle: { backgroundColor: t.headerBg },
                        headerTintColor: t.accent,
                        headerTitleStyle: { fontWeight: '800', fontSize: 20 },
                        contentStyle: { backgroundColor: t.bg },
                        animation: 'slide_from_right',
                    }}
                >
                    {user ? (
                        <>
                            <Stack.Screen
                                name='Home'
                                component={HomeScreen}
                                options={{
                                    title: 'Fitcha',
                                    headerBackVisible: false,
                                    headerRight: () => (
                                        <HeaderActions showLogout />
                                    ),
                                }}
                            />

                            <Stack.Screen
                                name='Week'
                                component={WeekScreen}
                                options={{
                                    title: translate('week.title'),
                                    headerRight: () => (
                                        <HeaderActions showLogout />
                                    ),
                                }}
                            />

                            <Stack.Screen
                                name='Profile'
                                component={ProfileScreen}
                                options={{
                                    title: translate('navigation.profile'),
                                    headerRight: () => <ThemeToggle />,
                                }}
                            />

                            <Stack.Screen
                                name='Day'
                                component={DayScreen}
                                options={{
                                    title: translate('day.title'),
                                    headerRight: () => <HeaderActions />,
                                }}
                            />

                            <Stack.Screen
                                name='MachineDetail'
                                component={MachineDetailScreen}
                                options={{
                                    title: translate(
                                        'navigation.machineDetail',
                                    ),
                                    headerRight: () => <HeaderActions />,
                                }}
                            />

                            <Stack.Screen
                                name='Workout'
                                component={WorkoutScreen}
                                options={{
                                    headerShown: false,
                                    animation: 'slide_from_bottom',
                                }}
                            />
                        </>
                    ) : (
                        <>
                            <Stack.Screen
                                name='Login'
                                component={LoginScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name='Register'
                                component={RegisterScreen}
                                options={{ headerShown: false }}
                            />
                        </>
                    )}
                </Stack.Navigator>
            </NavigationContainer>

            <ConfirmModal
                visible={!user && isSessionExpiredNoticeVisible}
                title={translate('auth.sessionExpired.title')}
                message={translate('auth.sessionExpired.message')}
                confirmLabel={translate('common.actions.understand')}
                hideCancel
                confirmVariant='accent'
                onClose={dismissSessionExpiredNotice}
                onConfirm={dismissSessionExpiredNotice}
            />

            {updateNoticeModal}
        </>
    )
}
