export type AIWizardProps = {
    visible: boolean;
    onClose: () => void;
    onFinish: (data: WizardData) => Promise<void>;
};

export type WizardData = {
    height: string;
    weight: string;
    daysPerWeek: number | null;
    intensity: "leve" | "moderado" | "intenso" | null;
    goal: "hipertrofia" | "forca" | "resistencia" | "emagrecimento" | null;
};

export type WizardStep = 0 | 1 | 2 | 3 | 4; 

export type GPTResponse = {
    categories: {
        name: string;
        days: number[];
        machines: {
            name: string;
            sets: [number, number, number];
        }[];
    }[];
};
