import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireStaff } from '../middleware/requireStaff.js';
import { createDailyRoom, createMeetingToken, deleteDailyRoom } from '../config/daily.js';
import { initiateCheckout } from '../config/azampay.js';

const router = Router();
const TIER_RANK = { free: 0, pro: 1, vip: 2 };

async function hasPurchasedSession(userId, sessionId) {
  const { data } = await supabaseAdmin
    .from('content_purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('content_type', 'live_session')
    .eq('content_id', sessionId)
    .eq('status', 'confirmed')
    .maybeSingle();
  return !!data;
}

const AUTO_CANCEL_GRACE_MS = 15 * 60 * 1000;

/**
 * Closes out any 'scheduled' session whose start time passed more than
 * 15 minutes ago and the host never started — there's no background job
 * running, so this runs opportunistically whenever sessions are listed
 * or someone tries to join, which is frequent enough that a stale
 * session gets cleaned up within moments of crossing the deadline.
 * Marked 'cancelled' rather than 'ended', since it never actually ran.
 */
async function autoCancelStaleSessions() {
  const cutoff = new Date(Date.now() - AUTO_CANCEL_GRACE_MS).toISOString();

  const { data: stale } = await supabaseAdmin
    .from('live_sessions')
    .select('id, provider_room_id')
    .eq('status', 'scheduled')
    .lt('scheduled_start', cutoff);

  if (!stale || stale.length === 0) return;

  await Promise.all(
    stale.map((s) => deleteDailyRoom(s.provider_room_id).catch((err) =>
      console.error(`Failed to delete Daily room for auto-cancelled session ${s.id}:`, err.message)
    ))
  );

  await supabaseAdmin
    .from('live_sessions')
    .update({ status: 'cancelled' })
    .in('id', stale.map((s) => s.id));
}

// GET /api/live-sessions — tier-gated list of upcoming/live sessions.
// Staff bypass the tier/access filter entirely — they're managing this
// content, not consuming it, so their own personal membership tier
// shouldn't hide sessions they created for other tiers. Priced sessions
// are always shown (so people can see and buy them), same as courses.
router.get('/', requireAuth, async (req, res) => {
  await autoCancelStaleSessions();

  const { data, error } = await supabaseAdmin
    .from('live_sessions')
    .select('*')
    .in('status', ['scheduled', 'live'])
    .order('scheduled_start', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const isStaff = ['moderator', 'admin', 'super_admin'].includes(req.profile.role);
  if (isStaff) {
    return res.json({ sessions: data });
  }

  const userRank = TIER_RANK[req.profile.membership_tier] ?? 0;
  const hasActiveAccess = req.profile.access_status === 'active';
  const visible = data.filter(
    (s) => s.required_tier === 'free' || (hasActiveAccess && userRank >= TIER_RANK[s.required_tier]) || !!s.price
  );

  res.json({ sessions: visible });
});

// POST /api/live-sessions — staff schedules a session, creates the Daily room
router.post('/', requireAuth, requireStaff, async (req, res) => {
  const { title, description, type, requiredTier, scheduledStart, scheduledEnd, recordEnabled, linkedCourseId, price } = req.body;

  if (!title || !type || !scheduledStart) {
    return res.status(400).json({ error: 'title, type, and scheduledStart are required' });
  }

  const roomName = `mhina-${Date.now()}`;
  const expiresAt = scheduledEnd
    ? Math.floor(new Date(scheduledEnd).getTime() / 1000)
    : Math.floor(new Date(scheduledStart).getTime() / 1000) + 60 * 60 * 4; // default 4h safety window

  try {
    await createDailyRoom({
      name: roomName,
      isBroadcast: type === 'broadcast',
      enableRecording: !!recordEnabled,
      expiresAt,
    });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }

  const { data, error } = await supabaseAdmin
    .from('live_sessions')
    .insert({
      title,
      description,
      type,
      host_id: req.user.id,
      linked_course_id: linkedCourseId ?? null,
      required_tier: requiredTier ?? 'free',
      price: price || null,
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd ?? null,
      record_enabled: !!recordEnabled,
      provider_room_id: roomName,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ session: data });
});

// POST /api/live-sessions/:id/checkout — pay for standalone access to a
// priced session, independent of membership tier.
router.post('/:id/checkout', requireAuth, async (req, res) => {
  const { phoneNumber } = req.body;

  const { data: session, error: sessionError } = await supabaseAdmin
    .from('live_sessions')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (sessionError || !session) return res.status(404).json({ error: 'Session not found' });
  if (!session.price) return res.status(400).json({ error: 'This session has no individual price set' });

  if (!process.env.AZAMPAY_VENDOR_ID) {
    return res.status(400).json({ error: 'Payments are not set up yet (AzamPay vendor ID pending)' });
  }
  if (!phoneNumber) {
    return res.status(400).json({ error: 'A phone number is required for mobile money checkout' });
  }

  const externalId = `content_live_session_${session.id}_${req.user.id}_${Date.now()}`;

  try {
    const checkout = await initiateCheckout({
      amount: session.price,
      currency: 'USD',
      externalId,
      vendorId: process.env.AZAMPAY_VENDOR_ID,
      userPhone: phoneNumber,
      redirectSuccessUrl: `${process.env.CLIENT_ORIGIN}/payment/success`,
      redirectFailUrl: `${process.env.CLIENT_ORIGIN}/payment/failed`,
    });

    await supabaseAdmin.from('content_purchases').insert({
      user_id: req.user.id,
      content_type: 'live_session',
      content_id: session.id,
      amount: session.price,
      currency: 'USD',
      status: 'pending',
      azampay_transaction_id: externalId,
    });

    res.json({ checkout });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// POST /api/live-sessions/:id/join — the actual access-gate enforcement
// point: checks tier OR purchase, then mints a Daily token scoped to
// this user's role.
router.post('/:id/join', requireAuth, async (req, res) => {
  await autoCancelStaleSessions();

  const { data: session, error } = await supabaseAdmin
    .from('live_sessions')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !session) return res.status(404).json({ error: 'Session not found' });

  // Host and staff always get in — the tier requirement is for regular
  // members joining as viewers, not for the person running the session.
  const isHost = session.host_id === req.user.id;
  const isStaff = ['moderator', 'admin', 'super_admin'].includes(req.profile.role);

  const userRank = TIER_RANK[req.profile.membership_tier] ?? 0;
  const hasActiveAccess = req.profile.access_status === 'active';
  const tierOk = session.required_tier === 'free' || (hasActiveAccess && userRank >= TIER_RANK[session.required_tier]);

  let allowed = isHost || isStaff || tierOk;
  if (!allowed && session.price) {
    allowed = await hasPurchasedSession(req.user.id, session.id);
  }

  if (!allowed) {
    return res.status(403).json({
      error: session.price
        ? `This session requires purchase ($${session.price}) or ${session.required_tier.toUpperCase()} tier`
        : `This session requires ${session.required_tier.toUpperCase()} tier`,
    });
  }

  // Timing gate for regular members: allowed once the host has started
  // the session (status = 'live'), or up to 5 minutes before the
  // scheduled start (a small waiting-room buffer) — never for a session
  // that hasn't opened yet, and never for one that already ended.
  const JOIN_WINDOW_MS = 5 * 60 * 1000;
  if (!isHost && !isStaff) {
    if (session.status === 'ended' || session.status === 'cancelled') {
      return res.status(403).json({ error: 'This session has ended.' });
    }
    if (session.status === 'scheduled') {
      const scheduledStartMs = new Date(session.scheduled_start).getTime();
      const opensAtMs = scheduledStartMs - JOIN_WINDOW_MS;
      if (Date.now() < opensAtMs) {
        return res.status(403).json({
          error: `This session hasn't started yet. You can join starting ${new Date(opensAtMs).toLocaleString()}.`,
          opensAt: new Date(opensAtMs).toISOString(),
        });
      }
    }
  }

  const role = isHost ? 'host' : 'viewer';

  try {
    const token = await createMeetingToken({
      roomName: session.provider_room_id,
      userName: req.profile.username,
      isOwner: isHost,
    });

    await supabaseAdmin
      .from('session_attendees')
      .upsert(
        { session_id: session.id, user_id: req.user.id, role, joined_at: new Date().toISOString() },
        { onConflict: 'session_id,user_id' }
      );

    res.json({ token, roomName: session.provider_room_id, role, sessionId: session.id });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// PATCH /api/live-sessions/:id/status — staff starts/ends a session
router.patch('/:id/status', requireAuth, requireStaff, async (req, res) => {
  const { status } = req.body; // 'live' | 'ended' | 'cancelled'

  const { data, error } = await supabaseAdmin
    .from('live_sessions')
    .update({ status })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Ending (or cancelling) a session should actually disconnect anyone
  // still in the call, not just block new joins — otherwise people
  // already connected would stay in the room until it naturally expires
  // (up to several hours later). Best-effort: if Daily's delete fails for
  // some reason, the session is still marked ended in our DB (which does
  // block new joins), so we don't fail the whole request over this.
  if (status === 'ended' || status === 'cancelled') {
    try {
      await deleteDailyRoom(data.provider_room_id);
    } catch (err) {
      console.error('Failed to delete Daily room after ending session:', err.message);
    }
  }

  res.json({ session: data });
});

export default router;
