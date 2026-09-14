import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { uploadImage } from '../lib/uploadImage.js';

const EMPTY_FORM = {
  instrument: '', direction: 'buy', entry_price: '', stop_loss: '',
  take_profit_1: '', timeframe: 'H1', required_tier: 'vip', analysis: '',
};

export default function AdminSignals() {
  const [signals, setSignals] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [chartFile, setChartFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  function load() {
    api.get('/signals').then((res) => setSignals(res.signals)).catch((err) => setError(err.message));
  }
  useEffect(load, []);

  async function publish(e) {
    e.preventDefault();
    setError(null);
    setUploading(true);
    try {
      let chart_media_id = null;
      if (chartFile) {
        const { media } = await uploadImage(chartFile);
        chart_media_id = media.id;
      }
      await api.post('/signals', {
        ...form,
        chart_media_id,
        entry_price: Number(form.entry_price),
        stop_loss: Number(form.stop_loss),
        take_profit_1: Number(form.take_profit_1),
      });
      setForm(EMPTY_FORM);
      setChartFile(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="admin-page">
      <h1>Publish Signal</h1>

      <form onSubmit={publish} className="admin-form">
        <input
          placeholder="Instrument (e.g. XAUUSD)"
          value={form.instrument}
          onChange={(e) => setForm({ ...form, instrument: e.target.value })}
          required
        />
        <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
        <input
          placeholder="Entry price"
          type="number" step="any"
          value={form.entry_price}
          onChange={(e) => setForm({ ...form, entry_price: e.target.value })}
          required
        />
        <input
          placeholder="Stop loss"
          type="number" step="any"
          value={form.stop_loss}
          onChange={(e) => setForm({ ...form, stop_loss: e.target.value })}
          required
        />
        <input
          placeholder="Take profit"
          type="number" step="any"
          value={form.take_profit_1}
          onChange={(e) => setForm({ ...form, take_profit_1: e.target.value })}
          required
        />
        <input
          placeholder="Timeframe (e.g. H1)"
          value={form.timeframe}
          onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
        />
        <select value={form.required_tier} onChange={(e) => setForm({ ...form, required_tier: e.target.value })}>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="vip">VIP</option>
        </select>
        <input
          placeholder="Analysis notes"
          value={form.analysis}
          onChange={(e) => setForm({ ...form, analysis: e.target.value })}
        />
        <label className="file-label">
          Chart image
          <input type="file" accept="image/*" onChange={(e) => setChartFile(e.target.files[0] ?? null)} />
        </label>
        <button type="submit" disabled={uploading}>{uploading ? 'Publishing…' : 'Publish signal'}</button>
      </form>

      {error && <p className="error">{error}</p>}

      <h2>Published signals</h2>
      {signals.map((s) => (
        <div key={s.id} className="signal-card compact">
          <div className="example-signal-header">
            <span className="pair">{s.instrument}</span>
            <span className={`direction ${s.direction}`}>{s.direction.toUpperCase()}</span>
          </div>
          <span className="session-meta">{s.status}</span>
        </div>
      ))}
    </div>
  );
}
