import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../lib/useProfile.js';
import { api } from '../lib/api.js';

export default function Dashboard() {
  const { profile, loading } = useProfile();
  const [signals, setSignals] = useState([]);
  const [news, setNews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Each fetched independently so one failing (e.g. non-VIP tier gets
    // a 403 on signals) doesn't block the rest of the dashboard.
    api.get('/signals').then((res) => setSignals(res.signals.slice(0, 3))).catch(() => {});
    api.get('/market/news').then((res) => setNews(res.news.slice(0, 3))).catch(() => {});
    api.get('/notifications').then((res) => setNotifications(res.notifications.slice(0, 5))).catch(() => {});
  }, []);

  if (loading) return <p>Loading…</p>;

  return (
    <div className="dashboard">
      <section className="dash-welcome">
        <div>
          <h1>Welcome back, {profile?.username}</h1>
          <p className="dash-tier">
            {profile?.membership_tier?.toUpperCase()} tier
            {profile?.access_status === 'active' && ' · Verified'}
          </p>
          {profile?.access_status !== 'active' && (
            <p className="dash-headway-prompt">
              Your Headway account is not verified. <Link to="/app/membership">Verify Headway now</Link>
            </p>
          )}
        </div>
      </section>

      <section className="quick-access">
        <Link to="/app/ai-analyzer" className="quick-access-item">
          <span className="qa-label">AI Chart Analyzer</span>
          <span className="qa-sub">Upload a chart, get instant analysis</span>
        </Link>
        <Link to="/app/signals" className="quick-access-item">
          <span className="qa-label">Latest Signals</span>
          <span className="qa-sub">Check today's trading setups</span>
        </Link>
        <Link to="/app/academy" className="quick-access-item">
          <span className="qa-label">Academy</span>
          <span className="qa-sub">Continue learning</span>
        </Link>
        <Link to="/app/community" className="quick-access-item">
          <span className="qa-label">Community</span>
          <span className="qa-sub">Share charts, learn together</span>
        </Link>
      </section>

      <section className="dash-columns">
        <div className="dash-col">
          <h2>Latest Signals</h2>
          {signals.length === 0 && <p className="empty-note">No signals visible yet — VIP tier required, or none published.</p>}
          {signals.map((s) => (
            <div key={s.id} className="signal-card compact">
              <div className="example-signal-header">
                <span className="pair">{s.instrument}</span>
                <span className={`direction ${s.direction}`}>{s.direction.toUpperCase()}</span>
              </div>
              <div className="example-signal-levels">
                <div><span className="label">Entry</span><span className="value">{s.entry_price}</span></div>
                <div><span className="label">SL</span><span className="value">{s.stop_loss}</span></div>
                <div><span className="label">TP</span><span className="value">{s.take_profit_1}</span></div>
              </div>
            </div>
          ))}
        </div>

        <div className="dash-col">
          <h2>Latest News</h2>
          {news.length === 0 && <p className="empty-note">No calendar events yet.</p>}
          {news.map((n) => (
            <div key={n.id} className="news-card compact">
              <strong>{n.currency}</strong> {n.event_name}
              <span className={`impact-badge ${n.impact}`}>{n.impact}</span>
            </div>
          ))}
        </div>

        <div className="dash-col">
          <h2>Notifications</h2>
          {notifications.length === 0 && <p className="empty-note">You're all caught up.</p>}
          {notifications.map((n) => (
            <div key={n.id} className={`notification-row ${n.is_read ? '' : 'unread'}`}>
              <strong>{n.title}</strong>
              <p>{n.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
