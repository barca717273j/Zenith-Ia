import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- SUPABASE SERVICE CLIENT ---
const rawUrl = process.env.VITE_SUPABASE_URL || "";
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseUrl = rawUrl.trim();
const supabaseKey = rawKey.trim();

const supabaseAdmin = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // --- STRIPE INTEGRATION ---
  const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

  // Webhook needs raw body for signature verification
  app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe || !supabaseAdmin) return res.status(500).json({ error: 'Stripe or Supabase not configured' });
    
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        // Fallback for dev without secret (NOT RECOMMENDED FOR PROD)
        event = JSON.parse(req.body);
      }
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const planId = session.metadata?.planId;

      if (userId && planId) {
        const { error } = await supabaseAdmin
          .from('users')
          .update({ 
            subscription_tier: planId.charAt(0).toUpperCase() + planId.slice(1),
            subscription_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (error) console.error('Error updating user subscription:', error);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        const { error } = await supabaseAdmin
          .from('users')
          .update({ 
            subscription_tier: 'Free',
            subscription_status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (error) console.error('Error canceling user subscription:', error);
      }
    }

    res.json({ received: true });
  });

  app.use(express.json());

  app.post('/api/create-checkout-session', async (req, res) => {
    if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
    const { planId, userId, email } = req.body;

    // Map planId to actual Stripe Price IDs
    const priceMap: Record<string, string> = {
      'pro': process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder',
      'elite': process.env.STRIPE_PRICE_ELITE || 'price_elite_placeholder',
      'master': process.env.STRIPE_PRICE_MASTER || 'price_master_placeholder',
    };

    const priceId = priceMap[planId];

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: planId === 'master' ? 'subscription' : 'subscription', // All are subscriptions
        success_url: `${process.env.APP_URL || 'http://localhost:3000'}/profile?success=true`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/profile?canceled=true`,
        customer_email: email,
        metadata: { userId, planId },
      });
      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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
