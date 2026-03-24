import { StatusBar } from "expo-status-bar";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { useEffect } from "react";
import { requestNotificationPermission } from "./services/notifications";
import { useNavigation } from "@react-navigation/native";

function InnerLayout() {
  const { t, toggle } = useTheme();

  const navigation = useNavigation();

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    navigation.setOptions({
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
    });
  }, [navigation, t.accent, t.bg, t.headerBg, t.mode, toggle]);

  return (
    <>
      <StatusBar style={t.mode === "dark" ? "light" : "dark"} />
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