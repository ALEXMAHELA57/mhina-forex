import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const STATUS_META = {
  open: { label: 'ACTIVE', className: 'status-open' },
  tp_hit: { label: 'TP HIT', className: 'status-win' },
  sl_hit: { label: 'SL HIT', className: 'status-loss' },
  breakeven: { label: 'BREAKEVEN', className: 'status-neutral' },
  cancelled: { label: 'CANCELLED', className: 'status-neutral' },
  no_trade: { label: 'NO TRADE', className: 'status-neutral' },
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return 'less than an hour ago';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Signals() {
  const [signals, setSignals] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/signals').then((res) => setSignals(res.signals)).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">{error}</p>;

  return (
    <div className="signals-page">
      <h1>VIP Signals</h1>
      {signals.length === 0 && <p className="empty-note">No signals published yet.</p>}
      {signals.map((s) => {
        const meta = STATUS_META[s.status] || STATUS_META.open;
        const isClosed = s.status !== 'open';
        return (
          <div key={s.id} className={`signal-card ${isClosed ? 'signal-closed' : ''}`}>
            <div className="signal-card-top">
              <div>
                <strong>{s.instrument}</strong> — <span className={`direction ${s.direction}`}>{s.direction.toUpperCase()}</span>
              </div>
              <span className={`status-badge ${meta.className}`}>{meta.label}</span>
            </div>
            <div>Entry: {s.entry_price} | SL: {s.stop_loss} | TP1: {s.take_profit_1}</div>
            <div>{s.analysis}</div>
            <p className="session-meta">
              Published {timeAgo(s.published_at)}
              {s.closed_at && ` — closed ${timeAgo(s.closed_at)}`}
            </p>
          </div>
        );
      })}
    </div>
  );
}
