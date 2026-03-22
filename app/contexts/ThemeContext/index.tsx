import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { dark, light, Mode } from "@/app/styles/theme";
import { ThemeCtx } from "./types";

const THEME_KEY = "app_theme";

const ThemeContext = createContext<ThemeCtx>({
  t: dark,
  toggle: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
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