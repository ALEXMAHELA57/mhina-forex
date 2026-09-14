import { supabaseAdmin } from '../config/supabase.js';

// Cap on image uploads per user per rolling 24h — protects the Cloudflare
// Images delivery/storage meter from accidental or deliberate spam via
// the community post upload path, which is open to every active member
// (not just staff). Staff are exempt since they also upload course
// thumbnails/signal charts as part of normal admin work.
const DAILY_IMAGE_UPLOAD_CAP = Number(process.env.DAILY_IMAGE_UPLOAD_CAP) || 30;

export async function rateLimitImageUploads(req, res, next) {
  if (['moderator', 'admin', 'super_admin'].includes(req.profile.role)) {
    return next();
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabaseAdmin
    .from('media_assets')
    .select('*', { count: 'exact', head: true })
    .eq('uploader_id', req.user.id)
    .eq('type', 'image')
    .gte('created_at', since);

  if (error) return res.status(500).json({ error: error.message });

  if (count >= DAILY_IMAGE_UPLOAD_CAP) {
    return res.status(429).json({
      error: `Daily image upload limit reached (${DAILY_IMAGE_UPLOAD_CAP}/24h). Try again later.`,
    });
  }

  next();
}
