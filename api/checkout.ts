import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

app.post('/api/checkout', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
  const { planId, userId, email } = req.body;

  if (!planId || !userId || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (planId === 'basic') {
    return res.status(400).json({ error: 'Basic plan is free and does not require checkout' });
  }

  const priceMap: Record<string, string> = {
    'pro': process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder',
    'master': process.env.STRIPE_PRICE_MASTER || 'price_master_placeholder',
  };

  const priceId = priceMap[planId];

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: planId === 'master' ? 'payment' : 'subscription',
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

export default app;
