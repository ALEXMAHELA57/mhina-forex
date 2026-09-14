import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import TradingViewTicker from '../components/TradingViewTicker.jsx';
import TradingViewCalendar from '../components/TradingViewCalendar.jsx';

export default function MarketNews() {
  const [analysis, setAnalysis] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/market/analysis').then((res) => setAnalysis(res.analysis)).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">{error}</p>;

  return (
    <div className="market-news-page">
      <h1>Live Prices</h1>
      <section className="widget-section">
        <TradingViewTicker />
      </section>

      <h1>Our Market Analysis</h1>
      {analysis.length === 0 && <p className="empty-note">No analysis published yet.</p>}
      {analysis.map((a) => (
        <div key={a.id} className="analysis-card">
          <strong>{a.instrument}</strong> — {a.trend} — Support {a.key_support} / Resistance {a.key_resistance}
          <p>{a.body}</p>
        </div>
      ))}

      <h1>Economic Calendar</h1>
      <section className="widget-section">
        <TradingViewCalendar />
      </section>
    </div>
  );
}
