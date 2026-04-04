import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import geminiRouter from './gemini';

dotenv.config();

const app = express();
app.use(express.json());

// --- AI INTEGRATION ---
app.use('/api/gemini', geminiRouter);

// --- SUPABASE SERVICE CLIENT ---
const rawUrl = process.env.VITE_SUPABASE_URL || "";
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseUrl = rawUrl.trim();
const supabaseKey = rawKey.trim();

const supabaseAdmin = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

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
      event = JSON.parse(req.body);
    }
    console.log('Webhook received! Type:', event.type);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;

    if (userId && planId) {
      console.log('Checkout completed for user:', userId, 'Plan:', planId);
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .upsert({ 
          user_id: userId,
          plan: planId,
          status: 'active',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) console.error('Error updating user subscription:', error);
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    const planId = subscription.metadata?.planId;

    if (userId && planId) {
      console.log('Subscription updated for user:', userId, 'Plan:', planId, 'Status:', subscription.status);
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .upsert({ 
          user_id: userId,
          plan: planId,
          status: subscription.status === 'active' ? 'active' : 'past_due',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) console.error('Error updating user subscription:', error);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;

    if (userId) {
      console.log('Subscription deleted for user:', userId);
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .upsert({ 
          user_id: userId,
          plan: 'basic',
          status: 'canceled',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) console.error('Error canceling user subscription:', error);
    }
  }

  res.json({ received: true });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV });
});

export default app;
