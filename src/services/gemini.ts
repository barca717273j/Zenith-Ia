import { GoogleGenAI } from "@google/genai";

// Fallback to client-side if needed, but prefer backend
const getClientAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY is not defined. AI features will be limited.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const callBackendAI = async (data: any) => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro na comunicação com o servidor de IA');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Backend AI Error:', error);
    throw error;
  }
};

export const generateLifeStrategy = async (userData: any, prompt: string) => {
  try {
    // Try backend first
    const result = await callBackendAI({
      prompt: `Você é o Zenith, uma IA de Sistema Operacional de Vida premium. 
      Dados do Usuário: ${JSON.stringify(userData)}
      Solicitação do Usuário: ${prompt}
      Forneça uma resposta estruturada, futurista e altamente acionável em Português.`,
      systemInstruction: "Você é o cérebro do Zenith. Seu objetivo é otimizar a vida do usuário em saúde, riqueza, conhecimento e relacionamentos. Seja conciso, futurista e encorajador. Responda sempre em Português do Brasil.",
    });
    return result.text;
  } catch (backendError) {
    // Fallback to client-side
    const ai = getClientAI();
    if (!ai) {
      // Mock response if no AI is available
      console.warn("Using mock response for generateLifeStrategy");
      return "O Zenith está em modo de manutenção neural. Sua solicitação foi registrada: '" + prompt + "'. Como recomendação geral, foque em blocos de 90 minutos de trabalho profundo e mantenha sua hidratação em níveis ótimos.";
    }
    
    const model = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Você é o Zenith, uma IA de Sistema Operacional de Vida premium. 
      Dados do Usuário: ${JSON.stringify(userData)}
      Solicitação do Usuário: ${prompt}
      Forneça uma resposta estruturada, futurista e altamente acionável em Português.`,
      config: {
        systemInstruction: "Você é o cérebro do Zenith. Seu objetivo é otimizar a vida do usuário em saúde, riqueza, conhecimento e relacionamentos. Seja conciso, futurista e encorajador. Responda sempre em Português do Brasil.",
        temperature: 0.7,
      }
    });

    const response = await model;
    return response.text;
  }
};

export const askAI = async (options: { 
  prompt: string, 
  systemInstruction?: string, 
  model?: string,
  responseMimeType?: string,
  responseSchema?: any
}) => {
  try {
    const result = await callBackendAI({
      prompt: options.prompt,
      systemInstruction: options.systemInstruction,
      model: options.model || "gemini-3-flash-preview"
    });
    
    if (options.responseMimeType === "application/json") {
      return JSON.parse(result.text || "{}");
    }
    return result.text;
  } catch (backendError) {
    const ai = getClientAI();
    if (!ai) {
      // Mock response if no AI is available
      console.warn("Using mock response for askAI");
      if (options.responseMimeType === "application/json") {
        // Return a generic valid JSON based on common patterns in the app
        if (options.prompt.toLowerCase().includes("decisão") || options.prompt.toLowerCase().includes("dilema")) {
          return {
            pros: ["Aumento de produtividade", "Melhoria na saúde a longo prazo"],
            cons: ["Esforço inicial elevado", "Necessidade de disciplina"],
            longTermImpact: "Impacto positivo exponencial na sua trajetória de vida.",
            goalAlignment: "Totalmente alinhado com sua busca pela excelência.",
            neuralInsight: "A disciplina é a ponte entre seus objetivos e suas conquistas.",
            riskLevel: "Medium"
          };
        }
        return {};
      }
      return "O Zenith está processando sua solicitação offline. Continue focado em seus objetivos.";
    }
    
    const model = ai.models.generateContent({
      model: options.model || "gemini-3-flash-preview",
      contents: options.prompt,
      config: {
        systemInstruction: options.systemInstruction,
        responseMimeType: options.responseMimeType as any,
        responseSchema: options.responseSchema,
        temperature: 0.7,
      }
    });

    const response = await model;
    if (options.responseMimeType === "application/json") {
      return JSON.parse(response.text || "{}");
    }
    return response.text;
  }
};
