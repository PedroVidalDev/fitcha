export type WizardData = {
  daysPerWeek: number | null;
  intensity: "leve" | "moderado" | "intenso" | null;
  goal: "hipertrofia" | "forca" | "resistencia" | "emagrecimento" | null;
};

export type WizardStep = 0 | 1 | 2 | 3; 

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
