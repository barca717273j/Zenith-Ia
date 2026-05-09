import { GoogleGenerativeAI } from "@google/generative-ai";

const getApiKey = () => {
  try {
    // Vite's define will replace this string if it exists
    // We use a check to avoid ReferenceError if process is not defined
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
    }
    return '';
  } catch (e) {
    return '';
  }
};

let genAI: GoogleGenerativeAI | null = null;

const getGenAI = () => {
  if (!genAI) {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. AI features will be limited.");
    }
    // Even if apiKey is empty, we initialize to avoid crash on start
    // Requests will fail later which is caught by try/catch
    genAI = new GoogleGenerativeAI(apiKey || 'DUMMY_KEY');
  }
  return genAI;
};

export const generateLifeStrategy = async (userData: any, prompt: string) => {
  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `Você é o ZENITH, uma IA de Sistema Operacional de Vida premium. 
          Dados do Usuário: ${JSON.stringify(userData)}
          Solicitação do Usuário: ${prompt}
          Forneça uma resposta estruturada, futurista e altamente acionável em Português.`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
      },
      systemInstruction: "Você é o cérebro do ZENITH. Seu objetivo é otimizar a vida do usuário em saúde, riqueza, conhecimento e relacionamentos. Seja conciso, futurista e encorajador. Responda sempre em Português do Brasil.",
    });

    const response = await result.response;
    return response.text();
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Gemini API Error:', errorMessage);
    
    if (errorMessage.toLowerCase().includes('failed to fetch')) {
      return "⚠️ **Erro de Conexão:** Não foi possível contatar o núcleo de IA (Failed to fetch). Verifique sua conexão com a internet ou se há algum bloqueio de rede (Adblock/Firewall) impedindo o acesso aos servidores do Google Gemini.";
    }

    return "O ZENITH está em modo de manutenção neural. Sua solicitação foi registrada: '" + prompt + "'. Como recomendação geral, foque em blocos de 90 minutos de trabalho profundo e mantenha sua hidratação em níveis ótimos.";
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
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ 
      model: options.model || "gemini-1.5-flash",
      systemInstruction: options.systemInstruction,
    });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: options.prompt }]
      }],
      generationConfig: {
        responseMimeType: options.responseMimeType,
        responseSchema: options.responseSchema,
        temperature: 0.7,
      }
    });

    const response = await result.response;
    const text = response.text();
    
    if (options.responseMimeType === "application/json") {
      try {
        const cleanText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanText);
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        return {};
      }
    }
    return text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    if (options.responseMimeType === "application/json") {
      return {};
    }
    return "O ZENITH está processando sua solicitação offline. Continue focado em seus objetivos.";
  }
};
