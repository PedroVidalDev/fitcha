export type AIWizardProps = {
    visible: boolean;
    onClose: () => void;
    onRequestBuyCredits: () => void;
    onFinish: (data: WizardData) => Promise<void>;
};

export type WizardData = {
    height: string;
    weight: string;
    selectedDays: number[];
    hoursPerDay: string;
    machinesPerDay: string;
    workoutSplit: string;
    intensity: "leve" | "moderado" | "intenso" | null;
    goal: "hipertrofia" | "forca" | "resistencia" | "emagrecimento" | null;
    customInstructions: string;
};

export type WizardStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type GPTResponse = {
    categories: {
        name: string;
        days: number[];
        machines: {
            catalogMachineId?: string;
            name: string;
            sets: [number, number, number];
        }[];
    }[];
};
