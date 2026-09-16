import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const EMPTY_ANALYSIS = { instrument: '', trend: 'Bullish', key_support: '', key_resistance: '', outlook_bias: '', body: '' };

export default function AdminMarketNews() {
  const [analysis, setAnalysis] = useState([]);
  const [analysisForm, setAnalysisForm] = useState(EMPTY_ANALYSIS);
  const [error, setError] = useState(null);

  function load() {
    api.get('/market/analysis').then((res) => setAnalysis(res.analysis)).catch((err) => setError(err.message));
  }
  useEffect(load, []);

  async function publishAnalysis(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/market/analysis', {
        ...analysisForm,
        key_support: analysisForm.key_support ? Number(analysisForm.key_support) : null,
        key_resistance: analysisForm.key_resistance ? Number(analysisForm.key_resistance) : null,
      });
      setAnalysisForm(EMPTY_ANALYSIS);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Market Analysis</h1>
      <p className="admin-note">
        The economic calendar and live prices are now real, live widgets
        (TradingView) shown directly on the Market & News pages — no admin
        entry needed for those anymore. This page is just for your own
        written market outlook.
      </p>
      {error && <p className="error">{error}</p>}

      <h2>Publish Market Analysis</h2>
      <form onSubmit={publishAnalysis} className="admin-form">
        <input
          placeholder="Instrument (e.g. Gold, EUR/USD)"
          value={analysisForm.instrument}
          onChange={(e) => setAnalysisForm({ ...analysisForm, instrument: e.target.value.toUpperCase() })}
          required
        />
        <select value={analysisForm.trend} onChange={(e) => setAnalysisForm({ ...analysisForm, trend: e.target.value })}>
          <option value="Bullish">Bullish</option>
          <option value="Bearish">Bearish</option>
          <option value="Neutral">Neutral</option>
        </select>
        <input
          placeholder="Key support level"
          type="number" step="any"
          value={analysisForm.key_support}
          onChange={(e) => setAnalysisForm({ ...analysisForm, key_support: e.target.value })}
        />
        <input
          placeholder="Key resistance level"
          type="number" step="any"
          value={analysisForm.key_resistance}
          onChange={(e) => setAnalysisForm({ ...analysisForm, key_resistance: e.target.value })}
        />
        <input
          placeholder="Outlook bias (short summary)"
          value={analysisForm.outlook_bias}
          onChange={(e) => setAnalysisForm({ ...analysisForm, outlook_bias: e.target.value })}
        />
        <input
          placeholder="Full analysis text"
          value={analysisForm.body}
          onChange={(e) => setAnalysisForm({ ...analysisForm, body: e.target.value })}
        />
        <button type="submit">Publish analysis</button>
      </form>

      <h2>Recent analysis</h2>
      {analysis.map((a) => (
        <div key={a.id} className="analysis-card">
          <strong>{a.instrument}</strong> — {a.trend} — Support {a.key_support} / Resistance {a.key_resistance}
        </div>
      ))}
    </div>
  );
}
