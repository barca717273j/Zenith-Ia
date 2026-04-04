import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

router.post('/', async (req, res) => {
  try {
    const { prompt, systemInstruction, model: modelName = 'gemini-3-flash-preview', history = [] } = req.body;

    const ai = getAI();
    if (!ai) {
      console.warn('GEMINI_API_KEY not configured on server');
      return res.status(503).json({ 
        error: 'AI service not configured',
        message: 'A chave de API do Gemini não foi configurada no servidor.'
      });
    }

    const model = ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const result = await model;
    res.json({ text: result.text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
});

export default router;
