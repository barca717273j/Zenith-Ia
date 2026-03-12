import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {

  if (!aiInstance) {

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("Gemini API not configured");
      return null;
    }

    aiInstance = new GoogleGenAI({ apiKey });

  }

  return aiInstance;
};

export const generateLifeStrategy = async (userData: any, prompt: string) => {

  const ai = getAI();

  if (!ai) {
    return "AI não configurada ainda.";
  }

  const response = await ai.models.generateContent({

    model: "gemini-1.5-flash",

    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are Zenith, a premium Life Operating System AI.

User Data: ${JSON.stringify(userData)}

User Request:
${prompt}

Provide a structured, futuristic, and actionable response.`
          }
        ]
      }
    ],

    generationConfig: {
      temperature: 0.7
    }

  });

  return response.text || "Sem resposta da IA.";
};

export const generateRoutine = async (preferences: any) => {

  const ai = getAI();

  if (!ai) {
    return [];
  }

  const response = await ai.models.generateContent({

    model: "gemini-1.5-flash",

    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Generate an optimized daily routine based on:

${JSON.stringify(preferences)}

Return JSON with:
time
task
category`
          }
        ]
      }
    ],

    generationConfig: {
      temperature: 0.4
    }

  });

  try {
    return JSON.parse(response.text || "[]");
  } catch {
    return [];
  }
};
