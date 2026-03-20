import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#1a0a00" },
          headerTintColor: "#F4A261",
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: "#0d0500" },
          animation: "slide_from_right",
        }}
      />
    </>
  );
}
