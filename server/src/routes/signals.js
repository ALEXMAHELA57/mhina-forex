import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireStaff } from '../middleware/requireStaff.js';

const router = Router();
const TIER_RANK = { free: 0, pro: 1, vip: 2 };

// GET /api/signals — tier-gated list of published signals for regular
// members; staff see ALL signals regardless of their own personal tier,
// since they're managing this content, not consuming it. (Previously
// this used a blanket requireTier('vip') on the whole route, which
// blocked staff from even viewing signals if their own membership_tier
// wasn't VIP — same class of bug as the live-sessions listing.)
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('signals')
    .select('*')
    .order('published_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const isStaff = ['moderator', 'admin', 'super_admin'].includes(req.profile.role);
  if (isStaff) {
    return res.json({ signals: data });
  }

  const userRank = TIER_RANK[req.profile.membership_tier] ?? 0;
  const hasActiveAccess = req.profile.access_status === 'active';
  const visible = data.filter(
    (s) => hasActiveAccess && userRank >= TIER_RANK[s.required_tier]
  );

  res.json({ signals: visible });
});

// POST /api/signals — staff-only publish
router.post('/', requireAuth, requireStaff, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('signals')
    .insert(req.body)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ signal: data });
});

export default router;
