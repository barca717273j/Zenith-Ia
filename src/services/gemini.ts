import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateLifeStrategy = async (userData: any, prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Você é o ZENITH, uma IA de Sistema Operacional de Vida premium. 
      Dados do Usuário: ${JSON.stringify(userData)}
      Solicitação do Usuário: ${prompt}
      Forneça uma resposta estruturada, futurista e altamente acionável em Português.`,
      config: {
        systemInstruction: "Você é o cérebro do ZENITH. Seu objetivo é otimizar a vida do usuário em saúde, riqueza, conhecimento e relacionamentos. Seja conciso, futurista e encorajador. Responda sempre em Português do Brasil.",
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    // Mock response if AI fails
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
    const response = await ai.models.generateContent({
      model: options.model || "gemini-3-flash-preview",
      contents: options.prompt,
      config: {
        systemInstruction: options.systemInstruction,
        temperature: 0.7,
        responseMimeType: options.responseMimeType as any,
        responseSchema: options.responseSchema
      }
    });
    
    if (options.responseMimeType === "application/json") {
      try {
        const cleanText = (response.text || "{}").replace(/```json|```/g, '').trim();
        return JSON.parse(cleanText);
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        return {};
      }
    }
    return response.text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    if (options.responseMimeType === "application/json") {
      if (options.prompt.toLowerCase().includes("decisão") || options.prompt.toLowerCase().includes("dilema")) {
        return {
          pros: ["Aumento de produtividade", "Melhoria na saúde a longo prazo"],
          cons: ["Esforço inicial elevado", "Disciplina necessária"],
          longTermImpact: "Impacto positivo exponencial na sua trajetória de vida.",
          goalAlignment: "Totalmente alinhado com sua busca pela excelência.",
          neuralInsight: "A disciplina é a ponte entre seus objetivos e suas conquistas.",
          riskLevel: "Medium"
        };
      }
      return {};
    }
    return "O ZENITH está processando sua solicitação offline. Continue focado em seus objetivos.";
  }
};
