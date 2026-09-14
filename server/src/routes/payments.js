import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { initiateCheckout } from '../config/azampay.js';

const router = Router();

// Single source of truth for membership pricing — change these two
// numbers and every checkout, the membership page, and the access gate
// all pick up the new price automatically.
const TIER_PRICES = {
  pro: { monthly: 150, lifetime: 1500 },
  vip: { monthly: 300, lifetime: 3000 },
};

// GET /api/payments/prices — lets the frontend show real prices without
// hardcoding them in multiple places.
router.get('/prices', (req, res) => {
  res.json({ prices: TIER_PRICES });
});

// POST /api/payments/checkout — starts an AzamPay checkout for a
// membership tier. Creates a `pending` payments row first (with the
// target tier attached) so we have a record even if the webhook is
// delayed, then reconciles by azampay_transaction_id when the webhook
// lands — at which point target_tier is what actually gets granted.
router.post('/checkout', requireAuth, async (req, res) => {
  const { tier, billingPeriod, phoneNumber } = req.body; // tier: 'pro'|'vip', billingPeriod: 'monthly'|'lifetime'

  if (!['pro', 'vip'].includes(tier)) {
    return res.status(400).json({ error: 'tier must be "pro" or "vip"' });
  }
  if (!['monthly', 'lifetime'].includes(billingPeriod)) {
    return res.status(400).json({ error: 'billingPeriod must be "monthly" or "lifetime"' });
  }

  // Fail fast with a clear message instead of letting an incomplete
  // AzamPay request crash further downstream with a cryptic parse error.
  if (!process.env.AZAMPAY_VENDOR_ID) {
    return res.status(400).json({
      error: 'Card/mobile-money payment is not set up yet (AzamPay vendor ID pending). Use Headway verification instead for now.',
    });
  }
  if (!phoneNumber) {
    return res.status(400).json({ error: 'A phone number is required for mobile money checkout' });
  }

  const amount = TIER_PRICES[tier][billingPeriod];
  const pkg = `${tier}_${billingPeriod}`; // e.g. 'pro_monthly', matches the payment_package enum
  const externalId = `mhina_${req.user.id}_${Date.now()}`;

  try {
    const checkout = await initiateCheckout({
      amount,
      currency: 'USD', // TODO: confirm supported currency/conversion with AzamPay for your pricing
      externalId,
      vendorId: process.env.AZAMPAY_VENDOR_ID,
      userPhone: phoneNumber,
      redirectSuccessUrl: `${process.env.CLIENT_ORIGIN}/payment/success`,
      redirectFailUrl: `${process.env.CLIENT_ORIGIN}/payment/failed`,
    });

    await supabaseAdmin.from('payments').insert({
      user_id: req.user.id,
      package: pkg,
      target_tier: tier,
      amount,
      currency: 'USD',
      status: 'pending',
      azampay_transaction_id: externalId,
    });

    res.json({ checkout });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// GET /api/payments/me — a user's own payment history.
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ payments: data });
});

// POST /api/payments/azampay/webhook
// Receives AzamPay's payment confirmation callback. Handles TWO kinds of
// purchase, distinguished by the externalId prefix we set at checkout
// time: "mhina_..." = membership subscription (payments table),
// "content_..." = a standalone course/session purchase (content_purchases
// table). This is the ONLY place either table gets a confirmed write —
// never from the client directly.
// TODO: verify AzamPay's webhook signature before trusting the payload
// (see AzamPay developer docs for the exact header/HMAC scheme).
router.post('/azampay/webhook', async (req, res) => {
  const {
    userId,
    transactionId,
    referenceId,
    amount,
    currency,
    status,
    channel,
  } = req.body;

  if (!userId || !transactionId) {
    return res.status(400).json({ error: 'Missing required webhook fields' });
  }

  if (transactionId.startsWith('content_')) {
    const { error: purchaseError } = await supabaseAdmin
      .from('content_purchases')
      .update({
        status: status === 'success' ? 'confirmed' : 'failed',
        paid_at: status === 'success' ? new Date().toISOString() : null,
      })
      .eq('azampay_transaction_id', transactionId);

    if (purchaseError) return res.status(500).json({ error: purchaseError.message });
    return res.json({ received: true });
  }

  // Deliberately don't take `package`/tier from the webhook payload —
  // we already stored the correct target_tier and package on our own
  // `payments` row at checkout time. Upserting by transaction ID here
  // only touches status/paid_at/etc; target_tier and package survive
  // untouched, and .select() below reads back the full row including them.
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('payments')
    .upsert(
      {
        user_id: userId,
        azampay_transaction_id: transactionId,
        azampay_reference_id: referenceId,
        amount,
        currency: currency ?? 'TZS',
        status: status === 'success' ? 'confirmed' : 'failed',
        provider_channel: channel,
        paid_at: status === 'success' ? new Date().toISOString() : null,
      },
      { onConflict: 'azampay_transaction_id' }
    )
    .select()
    .single();

  if (paymentError) return res.status(500).json({ error: paymentError.message });

  if (status === 'success' && payment) {
    const accessRoute = payment.package?.endsWith('lifetime') ? 'paid_lifetime' : 'paid_monthly';

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        access_status: 'active',
        access_route: accessRoute,
        membership_tier: payment.target_tier, // the actual fix: tier now really gets granted
      })
      .eq('id', userId);

    if (profileError) return res.status(500).json({ error: profileError.message });
  }

  res.json({ received: true });
});

export default router;
