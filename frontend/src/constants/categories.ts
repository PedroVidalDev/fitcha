export const MACHINE_CATEGORIES = [
    { key: "peito", label: "Peito", color: "#E24B4A" },
    { key: "costas", label: "Costas", color: "#378ADD" },
    { key: "pernas", label: "Pernas", color: "#639922" },
    { key: "ombros", label: "Ombros", color: "#F4A261" },
    { key: "biceps", label: "Bíceps", color: "#D4537E" },
    { key: "triceps", label: "Tríceps", color: "#7F77DD" },
    { key: "core", label: "Core", color: "#1D9E75" },
    { key: "cardio", label: "Cardio", color: "#D85A30" },
] as const;

export type MachineCategoryKey = (typeof MACHINE_CATEGORIES)[number]["key"];

export const getCategoryByKey = (key: string) =>
    MACHINE_CATEGORIES.find((c) => c.key === key) ?? MACHINE_CATEGORIES[0];

export const DAYS_LABEL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const DAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
