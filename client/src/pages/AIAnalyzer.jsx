import { useState } from 'react';
import { api } from '../lib/api.js';
import { uploadImage } from '../lib/uploadImage.js';

export default function AIAnalyzer() {
  const [instrument, setInstrument] = useState('XAUUSD');
  const [timeframe, setTimeframe] = useState('H1');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function analyze(e) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!file) {
      setError('Please choose a chart image first');
      return;
    }

    setUploading(true);
    try {
      // Upload the chart (validated + rate-limited, same as community posts),
      // then hand the resulting media id + delivery URL to the AI analyzer.
      const { media, deliveryUrl } = await uploadImage(file);

      const res = await api.post('/ai/chart-analyzer', {
        chartMediaId: media.id,
        chartImageUrl: deliveryUrl,
        instrument,
        timeframe,
      });
      setResult(res.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="ai-analyzer-page">
      <h1>AI Chart Analyzer</h1>
      <form onSubmit={analyze}>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0] ?? null)} required />
        <input placeholder="Instrument" value={instrument} onChange={(e) => setInstrument(e.target.value)} />
        <input placeholder="Timeframe" value={timeframe} onChange={(e) => setTimeframe(e.target.value)} />
        <button type="submit" disabled={uploading}>{uploading ? 'Analyzing…' : 'Analyze'}</button>
      </form>

      {error && <p className="error">{error}</p>}
      {result && (
        <div className="analysis-result">
          {/* Structure/key level/confirmation are useful either way — a
              trader benefits from knowing what's happening and what to
              watch for even when there's no trade to take right now.
              Throwing this away when no_clear_setup is true wastes
              genuinely useful reasoning. */}
          <div className="analysis-reasoning">
            <p><strong>Structure:</strong> {result.structure_note}</p>
            <p><strong>Key Level:</strong> {result.key_level_note}</p>
            <p><strong>What to watch for:</strong> {result.confirmation_note}</p>
          </div>

          {result.no_clear_setup ? (
            <div className="no-setup-banner">
              <span className="status-badge status-neutral">NO CLEAR SETUP YET</span>
              <p>Conditions aren't clean enough for a confident call right now — see "what to watch for" above for what would need to happen first.</p>
            </div>
          ) : (
            <div className="example-signal">
              <div className="example-signal-header">
                <span className="pair">{instrument}</span>
                <span className="status-badge status-open">SETUP FOUND</span>
              </div>
              <div className="example-signal-levels">
                <div><span className="label">Entry Zone</span><span className="value">{result.entry_zone}</span></div>
                <div><span className="label">Stop Loss</span><span className="value">{result.stop_loss}</span></div>
                <div><span className="label">Take Profit</span><span className="value">{result.take_profit}</span></div>
                <div><span className="label">Risk/Reward</span><span className="value">{result.risk_reward}</span></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
