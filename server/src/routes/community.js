import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireStaff } from '../middleware/requireStaff.js';
import { getImageDeliveryUrl } from '../config/cloudflareImages.js';

const router = Router();

// GET /api/community/posts — any logged-in member can view (Free tier
// included — community isn't a paid-tier feature), excludes removed posts.
// Embeds the chart image's media_assets row so we can compute a real,
// displayable delivery URL — this was missing before, which is why
// uploaded chart images never actually showed up in the feed.
router.get('/posts', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('community_posts')
    .select('*, profiles!author_id(username, avatar_media_id), chart_media:media_assets!chart_media_id(provider, provider_asset_id)')
    .eq('is_removed', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });

  const posts = data.map((post) => ({
    ...post,
    chart_image_url:
      post.chart_media?.provider === 'cloudflare_images'
        ? getImageDeliveryUrl(post.chart_media.provider_asset_id)
        : null,
  }));

  res.json({ posts });
});

// POST /api/community/posts — any logged-in member can post, Free tier included.
router.post('/posts', requireAuth, async (req, res) => {
  const { chartMediaId, caption, market, classification } = req.body;

  const { data, error } = await supabaseAdmin
    .from('community_posts')
    .insert({
      author_id: req.user.id,
      chart_media_id: chartMediaId ?? null,
      caption,
      market,
      classification: classification ?? 'general',
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ post: data });
});

// DELETE /api/community/posts/:id — own post or staff
router.delete('/posts/:id', requireAuth, async (req, res) => {
  const { data: post, error: fetchError } = await supabaseAdmin
    .from('community_posts')
    .select('author_id')
    .eq('id', req.params.id)
    .single();

  if (fetchError || !post) return res.status(404).json({ error: 'Post not found' });

  const isOwner = post.author_id === req.user.id;
  const isStaff = ['moderator', 'admin', 'super_admin'].includes(req.profile.role);
  if (!isOwner && !isStaff) return res.status(403).json({ error: 'Not authorized to delete this post' });

  const { error } = await supabaseAdmin.from('community_posts').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// POST /api/community/posts/:id/like — toggle like
router.post('/posts/:id/like', requireAuth, async (req, res) => {
  const { data: existing } = await supabaseAdmin
    .from('likes')
    .select('*')
    .eq('post_id', req.params.id)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin.from('likes').delete().eq('post_id', req.params.id).eq('user_id', req.user.id);
    return res.json({ liked: false });
  }

  await supabaseAdmin.from('likes').insert({ post_id: req.params.id, user_id: req.user.id });
  res.json({ liked: true });
});

// GET /api/community/posts/:id/comments — list comments on a post
router.get('/posts/:id/comments', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('comments')
    .select('*, profiles!author_id(username)')
    .eq('post_id', req.params.id)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ comments: data });
});

// POST /api/community/posts/:id/comments
router.post('/posts/:id/comments', requireAuth, async (req, res) => {
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'body is required' });

  const { data, error } = await supabaseAdmin
    .from('comments')
    .insert({ post_id: req.params.id, author_id: req.user.id, body })
    .select('*, profiles!author_id(username)')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ comment: data });
});

// POST /api/community/posts/:id/report
router.post('/posts/:id/report', requireAuth, async (req, res) => {
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ error: 'reason is required' });

  const { data, error } = await supabaseAdmin
    .from('reports')
    .insert({ reporter_id: req.user.id, post_id: req.params.id, reason })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ report: data });
});

// GET /api/community/reports — staff moderation queue
router.get('/reports', requireAuth, requireStaff, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('reports')
    .select('*, community_posts!post_id(*)')
    .eq('status', 'open')
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ reports: data });
});

// PATCH /api/community/reports/:id — staff resolves a report
router.patch('/reports/:id', requireAuth, requireStaff, async (req, res) => {
  const { status, removePost } = req.body; // status: 'reviewed' | 'actioned' | 'dismissed'

  if (removePost) {
    const { data: report } = await supabaseAdmin.from('reports').select('post_id').eq('id', req.params.id).single();
    if (report?.post_id) {
      await supabaseAdmin.from('community_posts').update({ is_removed: true }).eq('id', report.post_id);
    }
  }

  const { data, error } = await supabaseAdmin
    .from('reports')
    .update({ status, reviewed_by: req.user.id, reviewed_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ report: data });
});

export default router;
