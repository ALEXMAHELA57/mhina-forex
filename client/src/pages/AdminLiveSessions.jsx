import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useCall } from '../lib/CallContext.jsx';

const EMPTY_FORM = {
  title: '', description: '', type: 'mentorship',
  requiredTier: 'free', scheduledStart: '', recordEnabled: false, price: '',
};

export default function AdminLiveSessions() {
  const { startCall, leave } = useCall();
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function load() {
    api.get('/live-sessions').then((res) => setSessions(res.sessions)).catch((err) => setError(err.message));
  }
  useEffect(load, []);

  async function schedule(e) {
    e.preventDefault();
    if (submitting) return; // guards against a double-click firing this twice
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/live-sessions', {
        ...form,
        price: form.price ? Number(form.price) : null,
        scheduledStart: new Date(form.scheduledStart).toISOString(),
      });
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // "Start now" does two things: flips the session to live, then joins
  // the host into the call — which now opens as a persistent floating
  // window, so it stays connected even if you navigate to another page.
  async function startAndJoin(id) {
    setError(null);
    try {
      await api.patch(`/live-sessions/${id}/status`, { status: 'live' });
      const res = await api.post(`/live-sessions/${id}/join`);
      startCall(res);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function rejoin(id) {
    setError(null);
    try {
      const res = await api.post(`/live-sessions/${id}/join`);
      startCall(res);
    } catch (err) {
      setError(err.message);
    }
  }

  async function endSession(id) {
    setError(null);
    try {
      await api.patch(`/live-sessions/${id}/status`, { status: 'ended' });
      leave(); // disconnects the floating call window if it's this session
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Live Sessions Management</h1>

      <form onSubmit={schedule} className="admin-form">
        <input
          placeholder="Session title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="mentorship">Mentorship (interactive, small group)</option>
          <option value="broadcast">Broadcast (1 host, many viewers)</option>
        </select>
        <select value={form.requiredTier} onChange={(e) => setForm({ ...form, requiredTier: e.target.value })}>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="vip">VIP</option>
        </select>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.recordEnabled}
            onChange={(e) => setForm({ ...form, recordEnabled: e.target.checked })}
          />
          Record this session
        </label>
        <input
          placeholder="Individual price (optional, e.g. 20) — leave blank if only tier-gated"
          type="number" step="any"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <input
          type="datetime-local"
          value={form.scheduledStart}
          onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })}
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Scheduling…' : 'Schedule session'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <h2>Sessions</h2>
      {sessions.map((s) => (
        <div key={s.id} className="session-card">
          <div>
            <strong>{s.title}</strong>
            <span className="session-meta"> — {s.type} — {s.status} — {new Date(s.scheduled_start).toLocaleString()}{s.price ? ` — $${s.price}` : ''}</span>
          </div>
          {s.status === 'scheduled' && <button onClick={() => startAndJoin(s.id)}>Start now</button>}
          {s.status === 'live' && (
            <>
              <button onClick={() => rejoin(s.id)}>Rejoin call</button>
              <button onClick={() => endSession(s.id)}>End session</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
