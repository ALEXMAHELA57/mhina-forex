import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/notifications — own notifications, most recent first
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ notifications: data });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// PATCH /api/notifications/read-all
router.patch('/read-all', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', req.user.id)
    .eq('is_read', false);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

/**
 * Internal helper (not a route) — call this from other route handlers
 * (e.g. after publishing a signal, or before a live session starts) to
 * push a notification. Kept here since it shares the notifications table.
 */
export async function createNotification({ userId, type, title, body, relatedEntityType, relatedEntityId }) {
  return supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    related_entity_type: relatedEntityType ?? null,
    related_entity_id: relatedEntityId ?? null,
  });
}

export default router;
