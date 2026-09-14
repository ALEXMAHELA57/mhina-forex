import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireStaff } from '../middleware/requireStaff.js';
import { initiateCheckout } from '../config/azampay.js';

const router = Router();

const TIER_RANK = { free: 0, pro: 1, vip: 2 };

/**
 * A user has access to priced content either by meeting the tier
 * requirement (existing membership system) OR by having a confirmed
 * standalone purchase for this specific item — the two are independent,
 * per the "courses aren't tied to Free/Pro/VIP" design.
 */
async function hasPurchased(userId, contentType, contentId) {
  const { data } = await supabaseAdmin
    .from('content_purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .eq('status', 'confirmed')
    .maybeSingle();
  return !!data;
}

async function courseIsAccessible(course, profile) {
  const isStaff = ['moderator', 'admin', 'super_admin'].includes(profile.role);
  if (isStaff) return true;

  const userRank = TIER_RANK[profile.membership_tier] ?? 0;
  const hasActiveAccess = profile.access_status === 'active';
  const tierOk = course.required_tier === 'free' || (hasActiveAccess && userRank >= TIER_RANK[course.required_tier]);
  if (tierOk) return true;

  if (course.price) {
    return hasPurchased(profile.id, 'course', course.id);
  }
  return false;
}

// GET /api/courses — tier-gated OR individually-purchased list
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('order_index');

  if (error) return res.status(500).json({ error: error.message });

  const isStaff = ['moderator', 'admin', 'super_admin'].includes(req.profile.role);
  if (isStaff) {
    return res.json({ courses: data });
  }

  // Courses list always shows every published course (so people can see
  // and buy priced ones) — access to LESSONS is what's actually gated,
  // checked separately in /:id/lessons below. This mirrors real course
  // platforms: you can see a paid course's page before buying it.
  res.json({ courses: data });
});

// GET /api/courses/:id — basic course metadata (title, description,
// price, tier), always visible regardless of access — same principle as
// browsing a paid course's page before buying it. Lesson CONTENT is what
// stays gated, in /:id/lessons below.
router.get('/:id', requireAuth, async (req, res) => {
  const { data: course, error } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !course) return res.status(404).json({ error: 'Course not found' });
  res.json({ course });
});

// GET /api/courses/:id/lessons — tier OR purchase-checked against the course
router.get('/:id/lessons', requireAuth, async (req, res) => {
  const { data: course, error: courseError } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (courseError || !course) return res.status(404).json({ error: 'Course not found' });

  const allowed = await courseIsAccessible(course, { ...req.profile, id: req.user.id });
  if (!allowed) {
    return res.status(403).json({
      error: course.price
        ? `This course requires purchase ($${course.price}) or ${course.required_tier.toUpperCase()} tier`
        : `Requires ${course.required_tier.toUpperCase()} tier`,
    });
  }

  const { data: lessons, error: lessonsError } = await supabaseAdmin
    .from('lessons')
    .select('*')
    .eq('course_id', req.params.id)
    .order('order_index');

  if (lessonsError) return res.status(500).json({ error: lessonsError.message });
  res.json({ course, lessons });
});

// POST /api/courses — staff creates a course
router.post('/', requireAuth, requireStaff, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('courses').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ course: data });
});

// PATCH /api/courses/:id — staff edits a course
router.patch('/:id', requireAuth, requireStaff, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('courses')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ course: data });
});

// POST /api/courses/:id/lessons — staff adds a lesson to a course
router.post('/:id/lessons', requireAuth, requireStaff, async (req, res) => {
  const { title, videoMediaId, documentMediaId, notesUrl, orderIndex, durationSeconds } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const { data, error } = await supabaseAdmin
    .from('lessons')
    .insert({
      course_id: req.params.id,
      title,
      video_media_id: videoMediaId ?? null,
      document_media_id: documentMediaId ?? null,
      notes_url: notesUrl ?? null,
      order_index: orderIndex ?? 0,
      duration_seconds: durationSeconds ?? null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ lesson: data });
});

// POST /api/courses/:id/enroll — free/tier-included courses enroll directly;
// priced courses without tier access should call /checkout instead (the
// frontend decides which to call based on whether the course has a price
// and the user doesn't already meet the tier requirement).
router.post('/:id/enroll', requireAuth, async (req, res) => {
  const { data: course, error: courseError } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (courseError || !course) return res.status(404).json({ error: 'Course not found' });

  const allowed = await courseIsAccessible(course, { ...req.profile, id: req.user.id });
  if (!allowed) {
    return res.status(403).json({ error: 'Purchase or tier access required before enrolling' });
  }

  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .upsert({ user_id: req.user.id, course_id: req.params.id }, { onConflict: 'user_id,course_id' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ enrollment: data });
});

// POST /api/courses/:id/checkout — starts an AzamPay checkout for a
// standalone course purchase (independent of membership tier).
router.post('/:id/checkout', requireAuth, async (req, res) => {
  const { phoneNumber } = req.body;

  const { data: course, error: courseError } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (courseError || !course) return res.status(404).json({ error: 'Course not found' });
  if (!course.price) return res.status(400).json({ error: 'This course has no individual price set' });

  if (!process.env.AZAMPAY_VENDOR_ID) {
    return res.status(400).json({ error: 'Payments are not set up yet (AzamPay vendor ID pending)' });
  }
  if (!phoneNumber) {
    return res.status(400).json({ error: 'A phone number is required for mobile money checkout' });
  }

  const externalId = `content_course_${course.id}_${req.user.id}_${Date.now()}`;

  try {
    const checkout = await initiateCheckout({
      amount: course.price,
      currency: 'USD',
      externalId,
      vendorId: process.env.AZAMPAY_VENDOR_ID,
      userPhone: phoneNumber,
      redirectSuccessUrl: `${process.env.CLIENT_ORIGIN}/payment/success`,
      redirectFailUrl: `${process.env.CLIENT_ORIGIN}/payment/failed`,
    });

    await supabaseAdmin.from('content_purchases').insert({
      user_id: req.user.id,
      content_type: 'course',
      content_id: course.id,
      amount: course.price,
      currency: 'USD',
      status: 'pending',
      azampay_transaction_id: externalId,
    });

    res.json({ checkout });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
