import { ThemePalette } from "@/app/styles/theme";

export type ThemeCtx = {
  t: ThemePalette;
  toggle: () => void;
};