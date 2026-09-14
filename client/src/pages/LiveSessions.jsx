import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useCall } from '../lib/CallContext.jsx';
import ManualPaymentFlow from '../components/ManualPaymentFlow.jsx';

const JOIN_WINDOW_MS = 5 * 60 * 1000;

function joinability(session) {
  if (session.status === 'live') return { canJoin: true, label: 'Join' };
  if (session.status === 'scheduled') {
    const opensAt = new Date(session.scheduled_start).getTime() - JOIN_WINDOW_MS;
    if (Date.now() >= opensAt) return { canJoin: true, label: 'Join' };
    return {
      canJoin: false,
      label: `Opens ${new Date(opensAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    };
  }
  return { canJoin: false, label: 'Unavailable' };
}

export default function LiveSessions() {
  const { startCall } = useCall();
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState(null);
  const [joinErrors, setJoinErrors] = useState({}); // sessionId -> error message

  useEffect(() => {
    api.get('/live-sessions').then((res) => setSessions(res.sessions)).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setSessions((s) => [...s]), 30000);
    return () => clearInterval(interval);
  }, []);

  async function join(id) {
    setJoinErrors((b) => ({ ...b, [id]: null }));
    try {
      const res = await api.post(`/live-sessions/${id}/join`);
      startCall(res);
    } catch (err) {
      setJoinErrors((b) => ({ ...b, [id]: err.message }));
    }
  }

  if (error) return <p className="error">{error}</p>;

  return (
    <div className="live-sessions-page">
      <h1>Live Sessions</h1>
      {sessions.length === 0 && <p className="empty-note">No upcoming sessions right now.</p>}
      {sessions.map((s) => {
        const { canJoin, label } = joinability(s);
        return (
          <div key={s.id} className="session-card session-card-column">
            <div className="session-card-row">
              <div>
                <strong>{s.title}</strong>
                <span className="session-meta"> — {s.type} — {new Date(s.scheduled_start).toLocaleString()}{s.price ? ` — $${s.price}` : ''}</span>
              </div>
              <button onClick={() => join(s.id)} disabled={!canJoin}>{label}</button>
            </div>

            {joinErrors[s.id] && !s.price && <p className="error">{joinErrors[s.id]}</p>}

            {/* Paying is ALWAYS available for a priced session, regardless
                of whether the join window is open yet — otherwise there's
                no way to pay in advance for a session scheduled later. */}
            {s.price && (
              <div className="access-blocked">
                <p>{joinErrors[s.id] || `This session requires purchase ($${s.price}).`}</p>
                <ManualPaymentFlow purpose="live_session" contentId={s.id} price={s.price} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
