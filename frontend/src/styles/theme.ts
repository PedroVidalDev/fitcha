export type Mode = "dark" | "light";

export type ThemePalette = {
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

export const dark: ThemePalette = {
    mode: "dark",
    bg: "#160A03",
    card: "#241108",
    surface: "#34170A",
    border: "rgba(255, 183, 94, 0.16)",
    accent: "#F4A261",
    accentDark: "#E07A2F",
    textPrimary: "#F4A261",
    textMuted: "#A7591E",
    textDim: "#74421D",
    overlay: "rgba(0,0,0,0.75)",
    chipBg: "rgba(244, 162, 97, 0.12)",
    gradientCard: ["#3A1908", "#26140B"],
    gradientHero: ["#6A2A05", "#31170A", "#160A03"],
    gradientAccent: ["#FFD070", "#F4A261"],
    gradientModal: ["#341709", "#211008"],
    headerBg: "#1A0D05",
    inputBg: "rgba(78, 34, 11, 0.74)",
    histBg: "rgba(67, 28, 8, 0.78)",
    shadow: "#FFB75E",
};

export const light: ThemePalette = {
    mode: "light",
    bg: "#F7F1EA",
    card: "#FFF8F1",
    surface: "#F4E7DA",
    border: "rgba(194, 101, 26, 0.14)",
    accent: "#C2651A",
    accentDark: "#A3520F",
    textPrimary: "#3D1E06",
    textMuted: "#8B6B52",
    textDim: "#A7886D",
    overlay: "rgba(0,0,0,0.4)",
    chipBg: "rgba(194, 101, 26, 0.12)",
    gradientCard: ["#FFF9F3", "#F7EBDD"],
    gradientHero: ["#FFF8EF", "#F8E4C9", "#F7F1EA"],
    gradientAccent: ["#F4A261", "#C2651A"],
    gradientModal: ["#FFF9F3", "#F6E9D9"],
    headerBg: "#FFF7EF",
    inputBg: "rgba(194, 101, 26, 0.09)",
    histBg: "rgba(224, 122, 47, 0.08)",
    shadow: "#C2651A",
};
