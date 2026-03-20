import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "app_theme";

type Mode = "dark" | "light";

type ThemePalette = {
  mode: Mode;
  bg: string;
  card: string;
  surface: string;
  border: string;
  accent: string;
  accentDark: string;
  textPrimary: string;
  textMuted: string;
  textDim: string;
  overlay: string;
  chipBg: string;
  gradientCard: [string, string];
  gradientHero: [string, string, string];
  gradientAccent: [string, string];
  gradientModal: [string, string];
  headerBg: string;
  inputBg: string;
  histBg: string;
  shadow: string;
};

const dark: ThemePalette = {
  mode: "dark",
  bg: "#0d0500",
  card: "#1a0a00",
  surface: "#2a1508",
  border: "rgba(244, 162, 97, 0.12)",
  accent: "#F4A261",
  accentDark: "#E07A2F",
  textPrimary: "#F4A261",
  textMuted: "#8B4513",
  textDim: "#5a2a0a",
  overlay: "rgba(0,0,0,0.75)",
  chipBg: "rgba(244, 162, 97, 0.06)",
  gradientCard: ["#231005", "#180b02"],
  gradientHero: ["#2a1508", "#1a0a00", "#0d0500"],
  gradientAccent: ["#F4A261", "#E07A2F"],
  gradientModal: ["#231005", "#140900"],
  headerBg: "#110800",
  inputBg: "rgba(42, 21, 8, 0.6)",
  histBg: "rgba(35, 16, 5, 0.7)",
  shadow: "#F4A261",
};

const light: ThemePalette = {
  mode: "light",
  bg: "#F5F0EB",
  card: "#FFFFFF",
  surface: "#EDE4DB",
  border: "rgba(139, 69, 19, 0.12)",
  accent: "#C2651A",
  accentDark: "#A3520F",
  textPrimary: "#3D1E06",
  textMuted: "#8B6B52",
  textDim: "#B09880",
  overlay: "rgba(0,0,0,0.4)",
  chipBg: "rgba(194, 101, 26, 0.08)",
  gradientCard: ["#FFFFFF", "#FAF6F2"],
  gradientHero: ["#FFFFFF", "#FAF6F2", "#F5F0EB"],
  gradientAccent: ["#E07A2F", "#C2651A"],
  gradientModal: ["#FFFFFF", "#FAF6F2"],
  headerBg: "#FFFFFF",
  inputBg: "rgba(139, 69, 19, 0.06)",
  histBg: "rgba(139, 69, 19, 0.04)",
  shadow: "#8B4513",
};

type ThemeCtx = {
  t: ThemePalette;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeCtx>({
  t: dark,
  toggle: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val === "light" || val === "dark") setMode(val);
      setReady(true);
    });
  }, []);

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      AsyncStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, []);

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={{ t: mode === "dark" ? dark : light, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}