import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { reportError } from './_lib/events.js';

// Stripe needs the raw body to verify the webhook signature.
export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req as unknown as AsyncIterable<Buffer | string>) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    reportError(new Error('Stripe webhook misconfigured'), { endpoint: 'stripe-webhook', reason: 'missing_env' });
    res.status(500).json({ error: 'Server not configured' });
    return;
  }

  const stripe = new Stripe(stripeKey);

  const sigHeader = req.headers['stripe-signature'];
  const sig = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader;
  if (!sig) {
    res.status(400).json({ error: 'Missing Stripe-Signature header' });
    return;
  }

  let event: Stripe.Event;
  try {
    const raw = await readRawBody(req);
    event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
  } catch (e) {
    reportError(e, { endpoint: 'stripe-webhook', reason: 'signature_failed' });
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const subId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id ?? null;
        if (userId) {
          const update: { tier: 'pro'; stripe_subscription_id?: string } = { tier: 'pro' };
          if (subId) update.stripe_subscription_id = subId;
          await supabaseAdmin.from('profiles').update(update).eq('id', userId);
          console.log(`[stripe] checkout.session.completed -> Pro for ${userId}`);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        const isActive = sub.status === 'active' || sub.status === 'trialing';
        if (userId) {
          await supabaseAdmin
            .from('profiles')
            .update({
              tier: isActive ? 'pro' : 'free',
              stripe_subscription_id: sub.id,
            })
            .eq('id', userId);
          console.log(`[stripe] subscription.updated -> tier=${isActive ? 'pro' : 'free'} for ${userId}`);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (userId) {
          await supabaseAdmin
            .from('profiles')
            .update({ tier: 'free', stripe_subscription_id: null })
            .eq('id', userId);
          console.log(`[stripe] subscription.deleted -> Free for ${userId}`);
        }
        break;
      }
      default:
        // Ignore other events
        break;
    }
    res.status(200).json({ received: true });
  } catch (e) {
    reportError(e, { endpoint: 'stripe-webhook', reason: 'handler_failed' });
    res.status(500).json({ error: 'Handler failed' });
  }
}
