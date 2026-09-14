import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function AdminModeration() {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState(null);

  function load() {
    api.get('/community/reports').then((res) => setReports(res.reports)).catch((err) => setError(err.message));
  }
  useEffect(load, []);

  async function resolve(id, status, removePost) {
    await api.patch(`/community/reports/${id}`, { status, removePost });
    load();
  }

  if (error) return <p className="error">{error}</p>;

  return (
    <div className="admin-page">
      <h1>Community Moderation</h1>
      {reports.length === 0 && <p className="empty-note">No open reports.</p>}
      {reports.map((r) => (
        <div key={r.id} className="queue-item">
          <div>
            <strong>Reason:</strong> {r.reason}
            <p className="report-post-caption">{r.community_posts?.caption}</p>
          </div>
          <button onClick={() => resolve(r.id, 'dismissed', false)}>Dismiss</button>
          <button onClick={() => resolve(r.id, 'actioned', true)}>Remove post</button>
        </div>
      ))}
    </div>
  );
}
