import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";

import { ProfileShortcutButton } from "../components/ProfileShortcutButton";
import { useAuth } from "../contexts/AuthContext";
import { useI18n } from "../contexts/I18nContext";
import { useTheme } from "../contexts/ThemeContext";

import DayScreen from "../screens/Day";
import HomeScreen from "../screens/Home";
import LoginScreen from "../screens/Login";
import ProfileScreen from "../screens/Profile";
import RegisterScreen from "../screens/Register";
import WeekScreen from "../screens/Week";
import WorkoutScreen from "../screens/Workout";

import { DAYS_LABEL } from "../constants/categories";
import MachineDetailScreen from "../screens/Detail";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
    const { user, isLoading, logout } = useAuth();
    const { t, toggle } = useTheme();
    const { t: translate } = useI18n();

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

    const ThemeToggle = () => (
        <TouchableOpacity onPress={toggle} style={{ padding: 6 }}>
            <Ionicons name={t.mode === "dark" ? "sunny" : "moon"} size={22} color={t.accent} />
        </TouchableOpacity>
    );

    const HeaderActions = ({ showLogout = false }: { showLogout?: boolean }) => (
        <View
            style={{
                flexDirection: "row",
                gap: 10,
                alignItems: "center",
            }}
        >
            <ThemeToggle />
            {showLogout && (
                <TouchableOpacity onPress={logout} style={{ padding: 6 }}>
                    <Ionicons name="log-out-outline" size={22} color={t.textMuted} />
                </TouchableOpacity>
            )}
            <ProfileShortcutButton />
        </View>
    );

    return (
        <NavigationContainer
            theme={{
                dark: t.mode === "dark",
                colors: {
                    primary: t.accent,
                    background: t.bg,
                    card: t.headerBg,
                    text: t.textPrimary,
                    border: t.border,
                    notification: t.accent,
                },
                fonts: {
                    regular: { fontFamily: "System", fontWeight: "400" },
                    medium: { fontFamily: "System", fontWeight: "500" },
                    bold: { fontFamily: "System", fontWeight: "700" },
                    heavy: { fontFamily: "System", fontWeight: "900" },
                },
            }}
        >
            <Stack.Navigator
                screenOptions={{
                    headerStyle: { backgroundColor: t.headerBg },
                    headerTintColor: t.accent,
                    headerTitleStyle: { fontWeight: "800", fontSize: 20 },
                    contentStyle: { backgroundColor: t.bg },
                    animation: "slide_from_right",
                }}
            >
                {user ? (
                    <>
                        <Stack.Screen
                            name="Home"
                            component={HomeScreen}
                            options={{
                                title: "Fitcha",
                                headerBackVisible: false,
                                headerRight: () => <HeaderActions showLogout />,
                            }}
                        />

                        <Stack.Screen
                            name="Week"
                            component={WeekScreen}
                            options={{
                                title: "Sua semana",
                                headerRight: () => <HeaderActions showLogout />,
                            }}
                        />

                        <Stack.Screen
                            name="Profile"
                            component={ProfileScreen}
                            options={{
                                title: translate("navigation.profile"),
                                headerRight: () => <ThemeToggle />,
                            }}
                        />

                        <Stack.Screen
                            name="Day"
                            component={DayScreen}
                            options={({ route }) => ({
                                title: DAYS_LABEL[route.params.dayIndex],
                                headerRight: () => <HeaderActions />,
                            })}
                        />

                        <Stack.Screen
                            name="MachineDetail"
                            component={MachineDetailScreen}
                            options={{
                                title: "Detalhe",
                                headerRight: () => <HeaderActions />,
                            }}
                        />

                        <Stack.Screen
                            name="Workout"
                            component={WorkoutScreen}
                            options={{
                                headerShown: false,
                                animation: "slide_from_bottom",
                            }}
                        />
                    </>
                ) : (
                    <>
                        <Stack.Screen
                            name="Login"
                            component={LoginScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Register"
                            component={RegisterScreen}
                            options={{ headerShown: false }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
