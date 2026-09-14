import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireStaff } from '../middleware/requireStaff.js';
import { getImageDeliveryUrl } from '../config/cloudflareImages.js';
import { createDocumentViewUrl } from '../config/supabaseStorage.js';

const router = Router();

// Same pricing table as the AzamPay flow — kept here too so manual
// requests compute the same numbers. If you only use manual payment
// going forward, this is now the single source of truth to edit.
const TIER_PRICES = {
  pro: { monthly: 150, lifetime: 1500 },
  vip: { monthly: 300, lifetime: 3000 },
};

// USDT (TRC20) is the only accepted payment method.
const PAYMENT_INSTRUCTIONS = {
  crypto: {
    currency: 'USDT',
    network: 'TRC20',
    address: 'TBZgroYMYyrhabDBCX34fo45rnhDJ2aAFf',
  },
};

// GET /api/manual-payments/instructions — public payment details + prices,
// shown before someone submits a request.
router.get('/instructions', (req, res) => {
  res.json({ instructions: PAYMENT_INSTRUCTIONS, prices: TIER_PRICES });
});

// POST /api/manual-payments/request — creates a pending request. Covers
// all three purchase types via `purpose`.
router.post('/request', requireAuth, async (req, res) => {
  const { purpose, targetTier, billingPeriod, contentId } = req.body;

  if (!['membership', 'course', 'live_session'].includes(purpose)) {
    return res.status(400).json({ error: 'purpose must be "membership", "course", or "live_session"' });
  }

  let amount, packageLabel, insertFields = {};

  if (purpose === 'membership') {
    if (!['pro', 'vip'].includes(targetTier) || !['monthly', 'lifetime'].includes(billingPeriod)) {
      return res.status(400).json({ error: 'targetTier ("pro"|"vip") and billingPeriod ("monthly"|"lifetime") are required' });
    }
    amount = TIER_PRICES[targetTier][billingPeriod];
    packageLabel = `${targetTier.toUpperCase()} — ${billingPeriod === 'monthly' ? 'Monthly' : 'Lifetime'}`;
    insertFields = { target_tier: targetTier, billing_period: billingPeriod };
  } else {
    if (!contentId) return res.status(400).json({ error: 'contentId is required' });
    const table = purpose === 'course' ? 'courses' : 'live_sessions';
    const { data: content, error: contentError } = await supabaseAdmin
      .from(table)
      .select('price, title')
      .eq('id', contentId)
      .single();

    if (contentError || !content) return res.status(404).json({ error: `${purpose} not found` });
    if (!content.price) return res.status(400).json({ error: `This ${purpose} has no individual price set` });

    amount = content.price;
    packageLabel = content.title;
    insertFields = { content_id: contentId };
  }

  const { data, error } = await supabaseAdmin
    .from('manual_payments')
    .insert({
      user_id: req.user.id,
      purpose,
      package_label: packageLabel,
      amount,
      currency: 'USD',
      status: 'pending',
      ...insertFields,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ request: data, instructions: PAYMENT_INSTRUCTIONS });
});

// POST /api/manual-payments/:id/proof — attach uploaded proof (image or
// PDF) to your own pending request.
router.post('/:id/proof', requireAuth, async (req, res) => {
  const { proofMediaId } = req.body;
  if (!proofMediaId) return res.status(400).json({ error: 'proofMediaId is required' });

  const { data: request, error: fetchError } = await supabaseAdmin
    .from('manual_payments')
    .select('user_id, status')
    .eq('id', req.params.id)
    .single();

  if (fetchError || !request) return res.status(404).json({ error: 'Request not found' });
  if (request.user_id !== req.user.id) return res.status(403).json({ error: 'Not your request' });
  if (request.status !== 'pending') return res.status(400).json({ error: 'This request is no longer pending' });

  const { data, error } = await supabaseAdmin
    .from('manual_payments')
    .update({ proof_media_id: proofMediaId })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ request: data });
});

// GET /api/manual-payments/me — a user's own requests
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('manual_payments')
    .select('*')
    .eq('user_id', req.user.id)
    .order('submitted_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ requests: data });
});

// GET /api/manual-payments/queue — staff review queue, with a viewable
// URL for the proof (public delivery URL for images, short-lived signed
// URL for PDFs).
router.get('/queue', requireAuth, requireStaff, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('manual_payments')
    .select('*, profiles!user_id(full_name, email, username), media_assets!proof_media_id(type, provider, provider_asset_id)')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const queue = await Promise.all(
    data.map(async (r) => {
      let proofUrl = null;
      if (r.media_assets) {
        if (r.media_assets.provider === 'cloudflare_images') {
          proofUrl = getImageDeliveryUrl(r.media_assets.provider_asset_id);
        } else if (r.media_assets.provider === 'supabase_storage') {
          proofUrl = await createDocumentViewUrl(r.media_assets.provider_asset_id).catch(() => null);
        }
      }
      return { ...r, proof_url: proofUrl, proof_type: r.media_assets?.type ?? null };
    })
  );

  res.json({ queue });
});

// PATCH /api/manual-payments/:id/review — staff approves/rejects. On
// approval, grants access via the SAME tables the AzamPay flow writes
// to — no changes needed anywhere else in the app.
router.patch('/:id/review', requireAuth, requireStaff, async (req, res) => {
  const { decision, notes } = req.body; // 'confirmed' | 'failed'
  if (!['confirmed', 'failed'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be "confirmed" or "failed"' });
  }

  const { data: request, error: fetchError } = await supabaseAdmin
    .from('manual_payments')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (fetchError || !request) return res.status(404).json({ error: 'Request not found' });

  const { error: updateError } = await supabaseAdmin
    .from('manual_payments')
    .update({ status: decision, reviewed_by: req.user.id, reviewed_at: new Date().toISOString(), notes })
    .eq('id', req.params.id);

  if (updateError) return res.status(500).json({ error: updateError.message });

  if (decision === 'confirmed') {
    if (request.purpose === 'membership') {
      const accessRoute = request.billing_period === 'lifetime' ? 'paid_lifetime' : 'paid_monthly';
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ access_status: 'active', access_route: accessRoute, membership_tier: request.target_tier })
        .eq('id', request.user_id);

      if (profileError) return res.status(500).json({ error: profileError.message });
    } else {
      const contentType = request.purpose === 'course' ? 'course' : 'live_session';
      const { error: purchaseError } = await supabaseAdmin.from('content_purchases').insert({
        user_id: request.user_id,
        content_type: contentType,
        content_id: request.content_id,
        amount: request.amount,
        currency: request.currency,
        status: 'confirmed',
        paid_at: new Date().toISOString(),
      });

      if (purchaseError) return res.status(500).json({ error: purchaseError.message });
    }
  }

  res.json({ ok: true });
});

export default router;
