 import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI | null => {
  if (!aiInstance) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();

    // 🔒 NÃO QUEBRA MAIS O APP
    if (!apiKey) {
      console.warn("GEMINI API KEY não configurada");
      return null;
    }

    aiInstance = new GoogleGenAI({ apiKey });
  }

  return aiInstance;
};

export const generateLifeStrategy = async (userData: any, prompt: string) => {
  const ai = getAI();

  if (!ai) {
    throw new Error("IA não configurada. Verifique a GEMINI API KEY.");
  }

  const response = await ai.models.generateContent({
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
      systemInstruction:
        "Você é o cérebro do Zenith. Seu objetivo é otimizar a vida do usuário em saúde, riqueza, conhecimento e relacionamentos. Seja conciso, futurista e encorajador. Responda sempre em Português do Brasil.",
      temperature: 0.7,
    },
  });

  return response.text;
};

export const generateRoutine = async (preferences: any) => {
  const ai = getAI();

  if (!ai) {
    throw new Error("IA não configurada. Verifique a GEMINI API KEY.");
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        text: `Gere uma rotina diária otimizada baseada em: ${JSON.stringify(preferences)}. 
Retorne um array JSON de objetos com 'time', 'task' e 'category'. Use Português para os campos 'task' e 'category'.`
      }
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Erro ao parsear rotina:", error);
    return [];
  }
};
