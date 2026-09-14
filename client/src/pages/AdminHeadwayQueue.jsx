import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function AdminHeadwayQueue() {
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState(null);

  function load() {
    api.get('/headway/queue').then((res) => setQueue(res.queue)).catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function review(id, decision) {
    await api.patch(`/headway/${id}/review`, { decision });
    load();
  }

  if (error) return <p className="error">{error}</p>;

  return (
    <div className="admin-headway-queue">
      <h1>Headway Verification Queue</h1>
      {queue.map((item) => (
        <div key={item.id} className="queue-item">
          <div>{item.profiles?.full_name} ({item.profiles?.email})</div>
          <div>Headway ID: {item.headway_identifier}</div>
          <button onClick={() => review(item.id, 'verified')}>Verify</button>
          <button onClick={() => review(item.id, 'rejected')}>Reject</button>
        </div>
      ))}
      {queue.length === 0 && <p>No pending submissions.</p>}
    </div>
  );
}
