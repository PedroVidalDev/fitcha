import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

import LoginScreen from "../screens/Login";
import RegisterScreen from "../screens/Register";
import CategoriesScreen from "../screens/Categories";
import MachinesScreen from "../screens/Machines";
import DetailScreen from "../screens/Detail";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { user, isLoading, logout } = useAuth();
  const { t, toggle } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: t.bg }}>
        <ActivityIndicator size="large" color={t.accent} />
      </View>
    );
  }

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
              name="Categories"
              component={CategoriesScreen}
              options={{
                title: "Fitcha",
                headerBackVisible: false,
                headerRight: () => (
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <TouchableOpacity onPress={toggle} style={{ padding: 6 }}>
                      <Ionicons name={t.mode === "dark" ? "sunny" : "moon"} size={22} color={t.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={logout} style={{ padding: 6 }}>
                      <Ionicons name="log-out-outline" size={22} color={t.textMuted} />
                    </TouchableOpacity>
                  </View>
                ),
              }}
            />
            <Stack.Screen
              name="Machines"
              component={MachinesScreen}
              options={({ route }) => ({
                title: route.params.categoryName,
                headerRight: () => (
                  <TouchableOpacity onPress={toggle} style={{ padding: 6 }}>
                    <Ionicons name={t.mode === "dark" ? "sunny" : "moon"} size={22} color={t.accent} />
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="Detail"
              component={DetailScreen}
              options={({ route }) => ({
                title: route.params.machineName,
                headerRight: () => (
                  <TouchableOpacity onPress={toggle} style={{ padding: 6 }}>
                    <Ionicons name={t.mode === "dark" ? "sunny" : "moon"} size={22} color={t.accent} />
                  </TouchableOpacity>
                ),
              })}
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