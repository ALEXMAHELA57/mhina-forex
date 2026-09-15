import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { uploadImage } from '../lib/uploadImage.js';

const EMPTY_FORM = {
  instrument: '', direction: 'buy', entry_price: '', stop_loss: '',
  take_profit_1: '', timeframe: 'H1', required_tier: 'vip', analysis: '',
};

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open (active)' },
  { value: 'tp_hit', label: 'Take Profit hit' },
  { value: 'sl_hit', label: 'Stop Loss hit' },
  { value: 'breakeven', label: 'Closed at breakeven' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_trade', label: 'No trade (setup invalidated)' },
];

export default function AdminSignals() {
  const [signals, setSignals] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null); // null = creating new
  const [chartFile, setChartFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  function load() {
    api.get('/signals').then((res) => setSignals(res.signals)).catch((err) => setError(err.message));
  }
  useEffect(load, []);

  function startEdit(s) {
    setEditingId(s.id);
    setForm({
      instrument: s.instrument,
      direction: s.direction,
      entry_price: s.entry_price,
      stop_loss: s.stop_loss,
      take_profit_1: s.take_profit_1 ?? '',
      timeframe: s.timeframe,
      required_tier: s.required_tier,
      analysis: s.analysis ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setChartFile(null);
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setUploading(true);
    try {
      let chart_media_id;
      if (chartFile) {
        const { media } = await uploadImage(chartFile);
        chart_media_id = media.id;
      }
      const payload = {
        ...form,
        entry_price: Number(form.entry_price),
        stop_loss: Number(form.stop_loss),
        take_profit_1: Number(form.take_profit_1),
        ...(chart_media_id ? { chart_media_id } : {}),
      };

      if (editingId) {
        await api.patch(`/signals/${editingId}`, payload);
      } else {
        await api.post('/signals', payload);
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function changeStatus(id, status) {
    try {
      await api.patch(`/signals/${id}`, { status });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this signal permanently? This cannot be undone.')) return;
    try {
      await api.delete(`/signals/${id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-page">
      <h1>{editingId ? 'Edit Signal' : 'Publish Signal'}</h1>

      <form onSubmit={submit} className="admin-form">
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
          Chart image {editingId && '(optional — leave blank to keep existing)'}
          <input type="file" accept="image/*" onChange={(e) => setChartFile(e.target.files[0] ?? null)} />
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" disabled={uploading}>
            {uploading ? 'Saving…' : editingId ? 'Save changes' : 'Publish signal'}
          </button>
          {editingId && <button type="button" onClick={cancelEdit}>Cancel edit</button>}
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      <h2>Published signals</h2>
      {signals.map((s) => (
        <div key={s.id} className="signal-card compact admin-signal-card">
          <div className="example-signal-header">
            <span className="pair">{s.instrument}</span>
            <span className={`direction ${s.direction}`}>{s.direction.toUpperCase()}</span>
          </div>
          <p className="session-meta">
            Published {new Date(s.published_at).toLocaleDateString()}
            {s.closed_at && ` — closed ${new Date(s.closed_at).toLocaleDateString()}`}
          </p>
          <select value={s.status} onChange={(e) => changeStatus(s.id, e.target.value)}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="admin-signal-actions">
            <button onClick={() => startEdit(s)}>Edit</button>
            <button onClick={() => remove(s.id)} className="danger-btn">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
