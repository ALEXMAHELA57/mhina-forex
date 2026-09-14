import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

// GET /api/public-courses — no auth required. Returns only safe
// marketing metadata (title, description, level, tier, price,
// thumbnail) for published courses — never lesson content, which stays
// behind the authenticated, tier/purchase-gated /api/courses routes.
router.get('/', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('courses')
    .select('id, title, description, level, required_tier, price, thumbnail_media_id')
    .eq('is_published', true)
    .order('order_index');

  if (error) return res.status(500).json({ error: error.message });
  res.json({ courses: data });
});

export default router;
