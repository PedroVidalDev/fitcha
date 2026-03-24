import { View, Text } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { DayBadgesProps } from "./types";

const DAYS_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];

export function DayBadges(props: DayBadgesProps) {
    const { days } = props;

    const { t } = useTheme();

    if (days.length === 0) return null;

    return (
        <View style={{ flexDirection: "row", gap: 4, marginTop: 6 }}>
        {DAYS_SHORT.map((label, i) => {
            const active = days.includes(i);
            return (
            <View
                key={i}
                style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: active ? t.accent : "transparent",
                opacity: active ? 1 : 0.3,
                }}
            >
                <Text style={{
                fontSize: 9,
                fontWeight: "800",
                color: active
                    ? (t.mode === "dark" ? "#0d0500" : "#FFF")
                    : t.textDim,
                }}>
                {label}
                </Text>
            </View>
            );
        })}
        </View>
    );
}