import { ThemePalette } from "@/src/styles/theme";

export type ThemeCtx = {
  t: ThemePalette;
  toggle: () => void;
};