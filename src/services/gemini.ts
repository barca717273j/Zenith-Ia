import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
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
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        text: `You are Zenith, a premium Life Operating System AI. 
        User Data: ${JSON.stringify(userData)}
        User Request: ${prompt}
        Provide a structured, futuristic, and highly actionable response.`
      }
    ],
    config: {
      systemInstruction: "You are the brain of Zenith. Your goal is to optimize the user's life across health, wealth, knowledge, and relationships. Be concise, futuristic, and encouraging.",
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
        text: `Generate an optimized daily routine based on: ${JSON.stringify(preferences)}. 
        Return a JSON array of objects with 'time', 'task', and 'category'.`
      }
    ],
    config: {
      responseMimeType: "application/json",
    }
  });

  const response = await model;
  return JSON.parse(response.text || "[]");
};
