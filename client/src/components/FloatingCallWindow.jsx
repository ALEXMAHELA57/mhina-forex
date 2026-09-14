import { useState } from 'react';
import { useCall } from '../lib/CallContext.jsx';
import { api } from '../lib/api.js';

const DAILY_DOMAIN = import.meta.env.VITE_DAILY_DOMAIN;

/**
 * Rendered once, at the top of the app (outside <Routes>), so it's
 * never unmounted by navigation. The single <iframe> below stays the
 * same element whether minimized or full-screen — only the wrapping
 * div's class changes — so the WebRTC connection never drops when you
 * switch between "minimize" and "maximize".
 */
export default function FloatingCallWindow() {
  const { activeCall, minimized, minimize, maximize, leave } = useCall();
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState(null);

  if (!activeCall) return null;

  if (!DAILY_DOMAIN) {
    return (
      <div className="video-call-overlay">
        <p className="error">VITE_DAILY_DOMAIN isn't set in client/.env.local.</p>
        <button onClick={leave}>Close</button>
      </div>
    );
  }

  const callUrl = `https://${DAILY_DOMAIN}/${activeCall.roomName}?t=${activeCall.token}`;
  const isHost = activeCall.role === 'host';

  // Ends the session for EVERYONE (flips status to 'ended' so the room
  // stops being joinable), not just leaving it locally — only the host
  // sees this, so a regular viewer can't end a session for the group.
  async function endSessionForEveryone() {
    setEnding(true);
    setError(null);
    try {
      await api.patch(`/live-sessions/${activeCall.sessionId}/status`, { status: 'ended' });
      leave();
    } catch (err) {
      setError(err.message);
      setEnding(false);
    }
  }

  return (
    <div className={minimized ? 'call-floating-mini' : 'video-call-overlay'}>
      <div className="call-header">
        <span>{minimized ? 'Live session' : `You're live — hosting as ${activeCall.role}`}</span>
        <div className="call-header-actions">
          {minimized ? (
            <button onClick={maximize}>Maximize</button>
          ) : (
            <button onClick={minimize}>Minimize</button>
          )}
          {isHost && (
            <button onClick={endSessionForEveryone} disabled={ending} className="end-session-btn">
              {ending ? 'Ending…' : 'End session'}
            </button>
          )}
          <button onClick={leave}>Leave</button>
        </div>
      </div>
      {error && <p className="error call-error">{error}</p>}
      <iframe
        title="MHINA FOREX live session"
        src={callUrl}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="call-frame"
      />
    </div>
  );
}
