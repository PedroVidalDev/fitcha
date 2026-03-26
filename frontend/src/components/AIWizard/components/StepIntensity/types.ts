export type StepIntensityProps = {
    value: "leve" | "moderado" | "intenso" | null;
    onChange: (v: "leve" | "moderado" | "intenso") => void;
};
