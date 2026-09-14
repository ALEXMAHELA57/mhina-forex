import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireStaff } from '../middleware/requireStaff.js';

const router = Router();

// POST /api/headway/submit — user submits their Headway account identifier
// after signing up via the referral link. Creates a pending review row.
router.post('/submit', requireAuth, async (req, res) => {
  const { headwayIdentifier } = req.body;
  if (!headwayIdentifier) {
    return res.status(400).json({ error: 'headwayIdentifier is required' });
  }

  const { data, error } = await supabaseAdmin
    .from('headway_accounts')
    .insert({ user_id: req.user.id, headway_identifier: headwayIdentifier, status: 'pending' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ headwayAccount: data });
});

// GET /api/headway/me — a user's own Headway submission(s) + status
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('headway_accounts')
    .select('*')
    .eq('user_id', req.user.id)
    .order('submitted_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ headwayAccounts: data });
});

// GET /api/headway/queue — staff-only review queue
router.get('/queue', requireAuth, requireStaff, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('headway_accounts')
    .select('*, profiles!user_id(full_name, email, username)')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ queue: data });
});

// PATCH /api/headway/:id/review — staff approves/rejects a submission.
// On approval, flips the user's access_status to active — same end state
// as a confirmed AzamPay payment.
router.patch('/:id/review', requireAuth, requireStaff, async (req, res) => {
  const { id } = req.params;
  const { decision, notes } = req.body; // decision: 'verified' | 'rejected'

  if (!['verified', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be "verified" or "rejected"' });
  }

  const { data: record, error: fetchError } = await supabaseAdmin
    .from('headway_accounts')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError || !record) return res.status(404).json({ error: 'Headway submission not found' });

  const { error: updateError } = await supabaseAdmin
    .from('headway_accounts')
    .update({ status: decision, reviewed_by: req.user.id, reviewed_at: new Date().toISOString(), notes })
    .eq('id', id);

  if (updateError) return res.status(500).json({ error: updateError.message });

  if (decision === 'verified') {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ access_status: 'active', access_route: 'headway' })
      .eq('id', record.user_id);

    if (profileError) return res.status(500).json({ error: profileError.message });
  }

  res.json({ ok: true });
});

export default router;
