import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/contexts/AuthContext";
import { I18nProvider } from "./src/contexts/I18nContext";
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
        <I18nProvider>
            <AuthProvider>
                <ThemeProvider>
                    <InnerApp />
                </ThemeProvider>
            </AuthProvider>
        </I18nProvider>
    );
}
