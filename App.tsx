import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/contexts/AuthContext";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";
import { AppNavigator } from "./src/router";

function InnerApp() {
    const { t } = useTheme();
    return (
        <>
            <StatusBar style={t.mode === "dark" ? "light" : "dark"} />
            <AppNavigator />
        </>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <InnerApp />
            </ThemeProvider>
        </AuthProvider>
    );
}
