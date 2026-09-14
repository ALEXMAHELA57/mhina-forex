import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireStaff, requireAdmin } from '../middleware/requireStaff.js';

const router = Router();

// GET /api/admin/stats — the numbers behind the admin dashboard's stat
// cards (Total Users, Active Users, Total Posts, Total Revenue).
// For a regular admin, the super_admin account is excluded from the
// counts too — not just the Users list — so there's no mismatch that
// would hint "there's one more account you can't see" (e.g. a total of
// 4 when only 3 users are ever visible to you).
router.get('/stats', requireAuth, requireStaff, async (req, res) => {
  try {
    const isSuperAdmin = req.profile.role === 'super_admin';

    let totalUsersQuery = supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
    let activeUsersQuery = supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('access_status', 'active');
    if (!isSuperAdmin) {
      totalUsersQuery = totalUsersQuery.neq('role', 'super_admin');
      activeUsersQuery = activeUsersQuery.neq('role', 'super_admin');
    }

    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: totalPosts },
      { data: payments },
      { data: contentPurchases },
      { data: manualPayments },
    ] = await Promise.all([
      totalUsersQuery,
      activeUsersQuery,
      supabaseAdmin.from('community_posts').select('*', { count: 'exact', head: true }).eq('is_removed', false),
      // Revenue comes from THREE places, all counted together: AzamPay
      // membership payments, AzamPay content purchases, and manual
      // (bank/mobile money) payments — since manual is now the primary
      // path, missing it here would make revenue look near-zero even
      // with real confirmed sales.
      supabaseAdmin.from('payments').select('amount').eq('status', 'confirmed'),
      supabaseAdmin.from('content_purchases').select('amount').eq('status', 'confirmed'),
      supabaseAdmin.from('manual_payments').select('amount').eq('status', 'confirmed'),
    ]);

    const sum = (rows) => (rows || []).reduce((total, r) => total + Number(r.amount || 0), 0);
    const totalRevenue = sum(payments) + sum(contentPurchases) + sum(manualPayments);

    res.json({ totalUsers, activeUsers, totalPosts, totalRevenue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users — list users, optionally filtered by a search term
// matching username or email. Simple offset pagination via ?page=.
// super_admin accounts are excluded from this list entirely unless the
// requester is themselves a super_admin — the platform owner's account
// shouldn't be visible to (or editable by) regular admins/moderators.
router.get('/users', requireAuth, requireStaff, async (req, res) => {
  const { search, page = 1 } = req.query;
  const pageSize = 25;
  const from = (Number(page) - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin
    .from('profiles')
    .select('id, full_name, username, email, role, membership_tier, access_status, member_since', { count: 'exact' })
    .order('member_since', { ascending: false })
    .range(from, to);

  if (req.profile.role !== 'super_admin') {
    query = query.neq('role', 'super_admin');
  }

  if (search) {
    query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data, total: count, page: Number(page), pageSize });
});

// PATCH /api/admin/users/:id — update a user's role, tier, or access
// status. Role changes are admin-only (not moderator) since granting
// staff/admin access is more sensitive than tier or suspension changes.
// A super_admin's own row can ONLY be edited by another super_admin —
// enforced here at the API level, not just hidden in the UI, so a
// regular admin can't reach it even by calling this endpoint directly.
router.patch('/users/:id', requireAuth, requireStaff, async (req, res) => {
  const { role, membership_tier, access_status } = req.body;

  if (role && !['admin', 'super_admin'].includes(req.profile.role)) {
    return res.status(403).json({ error: 'Only admins can change user roles' });
  }

  const { data: target, error: targetError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', req.params.id)
    .single();

  if (targetError || !target) return res.status(404).json({ error: 'User not found' });

  if (target.role === 'super_admin' && req.profile.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only a super admin can modify this account' });
  }

  const updates = {};
  if (role) updates.role = role;
  if (membership_tier) updates.membership_tier = membership_tier;
  if (access_status) updates.access_status = access_status;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ user: data });
});

export default router;
