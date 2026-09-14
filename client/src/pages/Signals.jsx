import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

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
      {signals.map((s) => (
        <div key={s.id} className="signal-card">
          <strong>{s.instrument}</strong> — {s.direction.toUpperCase()} — {s.status}
          <div>Entry: {s.entry_price} | SL: {s.stop_loss} | TP1: {s.take_profit_1}</div>
          <div>{s.analysis}</div>
        </div>
      ))}
    </div>
  );
}
