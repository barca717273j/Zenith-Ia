import express from "express";
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Stripe Setup
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", stripeEnabled: !!stripe });
});

app.post("/api/create-checkout-session", async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: "Stripe is not configured" });
  }

  const { priceId: planId, userId } = req.body;

  // Map plan names to price IDs (placeholders)
  const planMap: Record<string, string> = {
    'pro': 'price_pro_placeholder',
    'elite': 'price_elite_placeholder',
    'master': 'price_master_placeholder'
  };

  const priceId = planMap[planId];

  if (!priceId) {
    return res.status(400).json({ error: "Invalid plan ID" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.APP_URL}/?success=true`,
      cancel_url: `${process.env.APP_URL}/?canceled=true`,
      client_reference_id: userId,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export the app for Vercel
export default app;
