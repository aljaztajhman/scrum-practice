import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateRequest, getProfile, requestOrigin } from './_lib/auth';

const PROD_URL = 'https://scrum-practice.vercel.app';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const auth = await authenticateRequest(req);
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID_PRO;
  if (!stripeKey || !priceId) {
    res.status(500).json({ error: 'Stripe not configured' });
    return;
  }

  const stripe = new Stripe(stripeKey);

  const { user, supabaseAdmin } = auth;
  const profile = await getProfile(supabaseAdmin, user.id);
  if (!profile) {
    res.status(500).json({ error: 'Profile not found' });
    return;
  }

  // Already on Pro/Admin? No need to checkout.
  if (profile.tier === 'pro' || profile.tier === 'admin' || profile.is_admin) {
    res.status(400).json({ error: 'Already on Pro tier' });
    return;
  }

  // Get or create the Stripe customer for this user
  let customerId = profile.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabaseAdmin
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  const origin = requestOrigin(req, PROD_URL);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/?upgraded=true`,
    cancel_url: `${origin}/`,
    allow_promotion_codes: true,
    metadata: { supabase_user_id: user.id },
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
  });

  if (!session.url) {
    res.status(500).json({ error: 'Failed to create checkout session' });
    return;
  }

  res.status(200).json({ url: session.url });
}
