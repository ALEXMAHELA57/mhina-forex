import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { analyzeChartImage } from '../config/aiProvider.js';

const router = Router();

// POST /api/ai/chart-analyzer
// Flow: client has already uploaded the chart via /api/media/images and
// has a media_assets id + its public/delivery URL. This endpoint runs the
// analysis and stores the structured result.
router.post('/chart-analyzer', requireAuth, async (req, res) => {
  const { chartMediaId, chartImageUrl, instrument, timeframe, tradeType } = req.body;

  if (!chartMediaId || !chartImageUrl || !instrument || !timeframe) {
    return res.status(400).json({ error: 'chartMediaId, chartImageUrl, instrument, timeframe are required' });
  }

  try {
    const result = await analyzeChartImage({ imageUrl: chartImageUrl, instrument, timeframe, tradeType });

    const { data, error } = await supabaseAdmin
      .from('ai_chart_analyses')
      .insert({
        user_id: req.user.id,
        chart_media_id: chartMediaId,
        instrument,
        timeframe,
        trade_type: tradeType ?? null,
        structure_note: result.structure ?? null,
        key_level_note: result.keyLevel ?? null,
        confirmation_note: result.confirmation ?? null,
        entry_zone: result.entryZone ?? null,
        stop_loss: result.stopLoss ?? null,
        take_profit: result.takeProfit ?? null,
        risk_reward: result.riskReward ?? null,
        no_clear_setup: !!result.noClearSetup,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ analysis: data });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// GET /api/ai/chart-analyzer/history — user's own past analyses
router.get('/chart-analyzer/history', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('ai_chart_analyses')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ analyses: data });
});

// PATCH /api/ai/chart-analyzer/:id/share — share an analysis to Community
router.patch('/chart-analyzer/:id/share', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('ai_chart_analyses')
    .update({ shared_to_community: true })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ analysis: data });
});

export default router;
