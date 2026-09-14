import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireStaff } from '../middleware/requireStaff.js';

const router = Router();

// GET /api/market/analysis
router.get('/analysis', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('market_analysis')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ analysis: data });
});

// POST /api/market/analysis — staff publish
router.post('/analysis', requireAuth, requireStaff, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('market_analysis')
    .insert({ ...req.body, published_by: req.user.id })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ analysis: data });
});

// GET /api/market/news — economic calendar, filterable by currency/impact
router.get('/news', requireAuth, async (req, res) => {
  let query = supabaseAdmin.from('news_events').select('*').order('event_time', { ascending: true });

  if (req.query.currency) query = query.eq('currency', req.query.currency);
  if (req.query.impact) query = query.eq('impact', req.query.impact);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ news: data });
});

// POST /api/market/news — staff adds a calendar event
router.post('/news', requireAuth, requireStaff, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('news_events').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ event: data });
});

export default router;
