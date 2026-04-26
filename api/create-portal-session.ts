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
  if (!stripeKey) {
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
  if (!profile.stripe_customer_id) {
    res.status(400).json({ error: 'No Stripe customer for this account' });
    return;
  }

  const origin = requestOrigin(req, PROD_URL);

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${origin}/`,
  });

  res.status(200).json({ url: session.url });
}
