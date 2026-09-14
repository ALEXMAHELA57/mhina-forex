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
          {result.no_clear_setup ? (
            <p>No clear setup — analysis is inconclusive right now.</p>
          ) : (
            <>
              <p>Structure: {result.structure_note}</p>
              <p>Key Level: {result.key_level_note}</p>
              <p>Confirmation: {result.confirmation_note}</p>
              <p>Entry Zone: {result.entry_zone}</p>
              <p>Stop Loss: {result.stop_loss}</p>
              <p>Take Profit: {result.take_profit}</p>
              <p>Risk/Reward: {result.risk_reward}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
