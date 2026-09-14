import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function AdminManualPayments() {
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState(null);

  function load() {
    api.get('/manual-payments/queue').then((res) => setQueue(res.queue)).catch((err) => setError(err.message));
  }
  useEffect(load, []);

  async function review(id, decision) {
    try {
      await api.patch(`/manual-payments/${id}/review`, { decision });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <h1>Manual Payment Review</h1>
      {queue.length === 0 && <p className="empty-note">No pending payment requests.</p>}
      {queue.map((r) => (
        <div key={r.id} className="manual-payment-review-card">
          <div className="manual-payment-review-info">
            <strong>{r.profiles?.full_name}</strong> ({r.profiles?.email || r.profiles?.username})
            <p>{r.package_label} — ${r.amount} {r.currency}</p>
            <p className="session-meta">Submitted {new Date(r.submitted_at).toLocaleString()}</p>
          </div>

          {r.proof_url ? (
            r.proof_type === 'document' ? (
              <a href={r.proof_url} target="_blank" rel="noreferrer">View PDF proof</a>
            ) : (
              <img src={r.proof_url} alt="Payment proof" className="proof-preview" />
            )
          ) : (
            <p className="empty-note">No proof uploaded yet</p>
          )}

          <div className="manual-payment-review-actions">
            <button onClick={() => review(r.id, 'confirmed')} disabled={!r.proof_url}>Approve</button>
            <button onClick={() => review(r.id, 'failed')}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
