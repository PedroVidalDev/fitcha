import { WizardData } from "./types";

export function buildGPTPrompt(data: WizardData): string {
  const { daysPerWeek, intensity, goal } = data;

  const intensityMap = {
    leve: "iniciante, com volumes baixos e foco em aprendizado dos movimentos",
    moderado: "intermediário, com volume e carga moderados",
    intenso: "avançado, com alto volume, cargas pesadas e técnicas de intensificação",
  };

  const goalMap = {
    hipertrofia: "ganho de massa muscular (hipertrofia)",
    forca: "aumento de força máxima",
    resistencia: "resistência muscular e cardiovascular",
    emagrecimento: "emagrecimento com preservação de massa magra",
  };

  return [
    `Crie um plano de treino de musculação com as seguintes especificações:`,
    ``,
    `- Dias por semana: ${daysPerWeek}`,
    `- Intensidade: ${intensityMap[intensity!]}`,
    `- Objetivo: ${goalMap[goal!]}`,
    ``,
    `Distribua os grupos musculares de forma equilibrada entre os ${daysPerWeek} dias.`,
    `Para cada dia, liste as máquinas/exercícios com o peso sugerido para 3 séries (em kg).`,
    ``,
    `Responda APENAS com JSON válido, sem markdown, sem explicações, seguindo exatamente esta estrutura:`,
    ``,
    `{`,
    `  "categories": [`,
    `    {`,
    `      "name": "Nome do grupo (ex: Peito e Tríceps)",`,
    `      "days": [1, 4],`,
    `      "machines": [`,
    `        { "name": "Nome do exercício", "sets": [peso1, peso2, peso3] }`,
    `      ]`,
    `    }`,
    `  ]`,
    `}`,
    ``,
    `Os dias são números de 0 a 6 (0=Domingo, 1=Segunda... 6=Sábado).`,
    `Os pesos em "sets" são sugestões em kg para cada uma das 3 séries (decrescente ou constante).`,
  ].join("\n");
}

export function buildExpectedJSON(): string {
  return JSON.stringify({
    categories: [
      {
        name: "Peito e Tríceps",
        days: [1, 4],
        machines: [
          { name: "Supino Reto", sets: [40, 35, 30] },
          { name: "Crucifixo", sets: [12, 12, 10] },
          { name: "Tríceps Corda", sets: [20, 18, 15] },
        ],
      },
      {
        name: "Costas e Bíceps",
        days: [2, 5],
        machines: [
          { name: "Puxada Frontal", sets: [45, 40, 35] },
          { name: "Remada Baixa", sets: [35, 30, 30] },
          { name: "Rosca Direta", sets: [14, 12, 10] },
        ],
      },
    ],
  }, null, 2);
}