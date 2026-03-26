export type StepGoalProps = {
    value: "hipertrofia" | "forca" | "resistencia" | "emagrecimento" | null;
    onChange: (v: "hipertrofia" | "forca" | "resistencia" | "emagrecimento") => void;
};
