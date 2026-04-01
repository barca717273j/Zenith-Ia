import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const generateLifeStrategy = async (userData: any, prompt: string) => {
  const ai = getAI();
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        text: `Você é o Zenith, uma IA de Sistema Operacional de Vida premium. 
        Dados do Usuário: ${JSON.stringify(userData)}
        Solicitação do Usuário: ${prompt}
        Forneça uma resposta estruturada, futurista e altamente acionável em Português.`
      }
    ],
    config: {
      systemInstruction: "Você é o cérebro do Zenith. Seu objetivo é otimizar a vida do usuário em saúde, riqueza, conhecimento e relacionamentos. Seja conciso, futurista e encorajador. Responda sempre em Português do Brasil.",
      temperature: 0.7,
    }
  });

  const response = await model;
  return response.text;
};

export const generateRoutine = async (preferences: any) => {
  const ai = getAI();
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        text: `Gere uma rotina diária otimizada baseada em: ${JSON.stringify(preferences)}. 
        Retorne um array JSON de objetos com 'time', 'task' e 'category'. Use Português para os campos 'task' e 'category'.`
      }
    ],
    config: {
      responseMimeType: "application/json",
    }
  });

  const response = await model;
  return JSON.parse(response.text || "[]");
};
