import dotenv from 'dotenv';
dotenv.config();

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_BASE = 'https://api.daily.co/v1';

/**
 * Creates a Daily room for a scheduled session. `enableRecording` maps to
 * live_sessions.record_enabled — admin decides per session.
 */
export async function createDailyRoom({ name, isBroadcast, enableRecording, expiresAt, maxParticipants = 200 }) {
  const resp = await fetch(`${DAILY_BASE}/rooms`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      properties: {
        exp: expiresAt, // unix timestamp — auto-expire the room after the session
        enable_recording: enableRecording ? 'cloud' : undefined,
        // Broadcast sessions: only owners (hosts) can publish audio/video;
        // everyone else joins view-only. Mentorship sessions leave this open.
        owner_only_broadcast: !!isBroadcast,
        // Explicit ceiling rather than relying on Daily's implicit default —
        // 200 is Daily's standard max without contacting support; going
        // higher needs a request to Daily. Past this, further joins are
        // rejected outright, which caps both cost and load predictably.
        max_participants: maxParticipants,
        // Lets muted/view-only viewers in broadcast sessions still engage:
        // text chat, emoji reactions, and a hand-raise queue the host can
        // see — all rendered inside Daily's Prebuilt UI automatically.
        enable_chat: true,
        enable_emoji_reactions: true,
        enable_hand_raising: true,
      },
    }),
  });

  if (!resp.ok) throw new Error(`Daily room creation failed: ${await resp.text()}`);
  return resp.json(); // { name, url, ... }
}

/**
 * Mints a short-lived meeting token scoped to one user + one room.
 * `isOwner` grants host/co-host publish rights; everyone else is a viewer
 * in broadcast rooms (owner_only_broadcast enforces this server-side on
 * Daily's end, not just in our UI).
 */
export async function createMeetingToken({ roomName, userName, isOwner, expiresInSeconds = 3600 }) {
  const resp = await fetch(`${DAILY_BASE}/meeting-tokens`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: userName,
        is_owner: !!isOwner,
        exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
      },
    }),
  });

  if (!resp.ok) throw new Error(`Daily token creation failed: ${await resp.text()}`);
  const json = await resp.json();
  return json.token;
}

/**
 * Deletes a Daily room outright — this is what actually disconnects
 * everyone currently in the call, not just blocks new joins. Ending a
 * session should call this, since "ended" needs to mean the room is
 * genuinely closed, not just locked to newcomers while existing
 * participants stay connected until the room's original expiry.
 */
export async function deleteDailyRoom(roomName) {
  const resp = await fetch(`${DAILY_BASE}/rooms/${roomName}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
  });

  // A 404 just means the room's already gone (e.g. it expired naturally
  // or was already deleted) — treat that as success, not an error.
  if (!resp.ok && resp.status !== 404) {
    throw new Error(`Daily room deletion failed: ${await resp.text()}`);
  }
}
