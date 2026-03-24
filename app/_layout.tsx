import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { useEffect } from "react";
import { requestNotificationPermission } from "./services/notifications";

function InnerLayout() {
  const { t, toggle } = useTheme();

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <>
      <StatusBar style={t.mode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.headerBg },
          headerTintColor: t.accent,
          headerTitleStyle: { fontWeight: "800", fontSize: 20 },
          contentStyle: { backgroundColor: t.bg },
          animation: "slide_from_right",
          headerRight: () => (
            <TouchableOpacity onPress={toggle} style={{ padding: 6, marginRight: 4 }}>
              <Ionicons
                name={t.mode === "dark" ? "sunny" : "moon"}
                size={22}
                color={t.accent}
              />
            </TouchableOpacity>
          ),
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <InnerLayout />
    </ThemeProvider>
  );
}