import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Text, TouchableOpacity } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { RootStackParamList } from "../../router/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

function getInitials(name: string) {
    const initials = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");

    return initials || "U";
}

export function ProfileShortcutButton() {
    const navigation = useNavigation<Navigation>();
    const { user } = useAuth();
    const { t } = useTheme();

    const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";
    const initials = getInitials(user?.name ?? "");

    return (
        <TouchableOpacity
            onPress={() => navigation.navigate("Profile")}
            style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                backgroundColor: t.accent,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Text style={{ color: btnColor, fontSize: 12, fontWeight: "900" }}>{initials}</Text>
        </TouchableOpacity>
    );
}
