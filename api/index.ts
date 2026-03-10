import express from 'express';
import Stripe from 'stripe';

const app = express();
app.use(express.json());

// Lazy load Stripe to prevent crash if key is missing
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

app.post('/api/create-checkout-session', async (req, res) => {
  const { priceId, userId } = req.body;
  const s = getStripe();
  
  if (!s) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  // Map plan names to actual Stripe Price IDs (placeholders for now)
  const priceMap: Record<string, string> = {
    'pro': 'price_pro_id',
    'elite': 'price_elite_id',
    'master': 'price_master_id'
  };

  try {
    const session = await s.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceMap[priceId] || 'price_default',
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.APP_URL || 'http://localhost:3000'}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/profile`,
      client_reference_id: userId,
    });
    res.json({ url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
