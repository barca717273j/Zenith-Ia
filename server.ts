import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // --- STRIPE INTEGRATION ---
  const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

  app.post('/api/create-checkout-session', async (req, res) => {
    if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
    const { priceId, userId, email } = req.body;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${process.env.APP_URL || 'http://localhost:3000'}/profile?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/profile`,
        customer_email: email,
        metadata: { userId },
      });
      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // --- AI PROXY (GEMINI) ---
  const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

  app.post('/api/ai/chat', async (req, res) => {
    if (!ai) return res.status(500).json({ error: 'AI not configured' });
    const { prompt, systemInstruction, model = 'gemini-3-flash-preview' } = req.body;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || "Você é o Zenith, um mentor de alta performance."
        }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- VITE MIDDLEWARE / STATIC SERVING ---
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zenith Server running on http://localhost:${PORT}`);
  });
}

startServer();
