import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireStaff } from '../middleware/requireStaff.js';
import { rateLimitImageUploads } from '../middleware/rateLimitUploads.js';
import { createDirectUploadUrl, getImageDeliveryUrl } from '../config/cloudflareImages.js';
import { createBunnyVideo, generateTusUploadAuth, signPlaybackUrl } from '../config/bunnyStream.js';
import { createDocumentUploadUrl, createDocumentViewUrl } from '../config/supabaseStorage.js';

const router = Router();
const TIER_RANK = { free: 0, pro: 1, vip: 2 };

// POST /api/media/images/upload-url — front-end calls this first, gets a
// one-time URL, uploads the file straight to Cloudflare, then calls
// /images/confirm with the returned image ID to save the reference.
// Rate-limited per user/24h to protect against community-post upload spam.
router.post('/images/upload-url', requireAuth, rateLimitImageUploads, async (req, res) => {
  try {
    const { id, uploadURL } = await createDirectUploadUrl();
    res.json({ imageId: id, uploadURL });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// POST /api/media/images/confirm — saves the media_assets row once the
// browser has finished uploading directly to Cloudflare.
router.post('/images/confirm', requireAuth, async (req, res) => {
  const { imageId } = req.body;
  if (!imageId) return res.status(400).json({ error: 'imageId is required' });

  const { data, error } = await supabaseAdmin
    .from('media_assets')
    .insert({
      uploader_id: req.user.id,
      type: 'image',
      provider: 'cloudflare_images',
      provider_asset_id: imageId,
      view_only: false,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ media: data, deliveryUrl: getImageDeliveryUrl(imageId) });
});

// POST /api/media/videos/create — creates the Bunny video object and
// returns its GUID + signed TUS upload auth so the client can upload
// directly to Bunny. Staff-only for now (lesson/course video uploads);
// open this to regular members later if e.g. community video posts ship.
router.post('/videos/create', requireAuth, requireStaff, async (req, res) => {
  const { title } = req.body;
  try {
    const bunnyVideo = await createBunnyVideo(title || 'Untitled');
    const tusAuth = generateTusUploadAuth(bunnyVideo.guid);
    res.json({ videoGuid: bunnyVideo.guid, ...tusAuth });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// POST /api/media/videos/confirm — saves the media_assets row after the
// client's direct TUS upload to Bunny completes.
router.post('/videos/confirm', requireAuth, requireStaff, async (req, res) => {
  const { videoGuid, durationSeconds } = req.body;
  if (!videoGuid) return res.status(400).json({ error: 'videoGuid is required' });

  const { data, error } = await supabaseAdmin
    .from('media_assets')
    .insert({
      uploader_id: req.user.id,
      type: 'video',
      provider: 'bunny_stream',
      provider_asset_id: videoGuid,
      duration_seconds: durationSeconds ?? null,
      view_only: true,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ media: data });
});

// GET /api/media/videos/:id/playback-url — mints a short-lived signed
// playback URL. This is the gate: call it only after checking the
// requesting user's access/tier against the content that owns this video.
router.get('/videos/:id/playback-url', requireAuth, async (req, res) => {
  const { data: media, error } = await supabaseAdmin
    .from('media_assets')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !media) return res.status(404).json({ error: 'Media not found' });
  if (media.provider !== 'bunny_stream') {
    return res.status(400).json({ error: 'Playback URL only applies to Bunny Stream videos' });
  }

  const url = signPlaybackUrl(media.provider_asset_id);
  res.json({ playbackUrl: url });
});

// POST /api/media/documents/upload-url — staff gets a one-time signed
// URL to upload a PDF/ebook directly to Supabase Storage (private bucket).
router.post('/documents/upload-url', requireAuth, requireStaff, async (req, res) => {
  const { fileName } = req.body;
  if (!fileName) return res.status(400).json({ error: 'fileName is required' });

  try {
    const { path, token, signedUrl } = await createDocumentUploadUrl(fileName);
    res.json({ path, token, signedUrl });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// POST /api/media/documents/confirm — saves the media_assets row after
// the client's direct upload to Supabase Storage completes.
router.post('/documents/confirm', requireAuth, requireStaff, async (req, res) => {
  const { path, title } = req.body;
  if (!path) return res.status(400).json({ error: 'path is required' });

  const { data, error } = await supabaseAdmin
    .from('media_assets')
    .insert({
      uploader_id: req.user.id,
      type: 'document',
      provider: 'supabase_storage',
      provider_asset_id: path,
      view_only: true,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ media: data });
});

// GET /api/media/documents/:id/view-url — mints a short-lived signed URL
// to view a document. Checks the tier of whichever course/lesson this
// document belongs to before minting the URL — same class of gate as
// courses/signals/live-sessions, so a Pro/VIP-only book can't be read
// by a free member just by knowing its media ID.
router.get('/documents/:id/view-url', requireAuth, async (req, res) => {
  const { data: media, error } = await supabaseAdmin
    .from('media_assets')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !media) return res.status(404).json({ error: 'Document not found' });
  if (media.provider !== 'supabase_storage') {
    return res.status(400).json({ error: 'View URL only applies to Supabase Storage documents' });
  }

  const isStaff = ['moderator', 'admin', 'super_admin'].includes(req.profile.role);
  if (!isStaff) {
    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('course_id, courses(required_tier)')
      .eq('document_media_id', req.params.id)
      .maybeSingle();

    const requiredTier = lesson?.courses?.required_tier ?? 'free';
    const userRank = TIER_RANK[req.profile.membership_tier] ?? 0;
    const hasActiveAccess = req.profile.access_status === 'active';
    const allowed = requiredTier === 'free' || (hasActiveAccess && userRank >= TIER_RANK[requiredTier]);

    if (!allowed) {
      return res.status(403).json({ error: `This document requires ${requiredTier.toUpperCase()} tier` });
    }
  }

  try {
    const url = await createDocumentViewUrl(media.provider_asset_id);
    res.json({ viewUrl: url });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
