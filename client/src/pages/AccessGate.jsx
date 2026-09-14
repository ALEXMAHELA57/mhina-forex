import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useProfile } from '../lib/useProfile.js';
import ManualPaymentFlow from '../components/ManualPaymentFlow.jsx';
import HeadwaySwitchNote from '../components/HeadwaySwitchNote.jsx';

const HEADWAY_LINK = import.meta.env.VITE_HEADWAY_REFERRAL_LINK
  || 'https://headway.partners/user/signup?hwp=dfe932';

export default function AccessGate() {
  const { profile, loading } = useProfile();
  const [headwayIdentifier, setHeadwayIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [prices, setPrices] = useState(null);

  useEffect(() => {
    api.get('/manual-payments/instructions').then((res) => setPrices(res.prices)).catch(() => {});
  }, []);

  async function submitHeadway(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/headway/submit', { headwayIdentifier });
      setMessage('Submitted — an admin will verify your Headway account shortly.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p>Loading…</p>;
  if (profile?.access_status === 'active') {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className="access-gate">
      <h1>Get access to MHINA FOREX</h1>

      <section>
        <h2>Option 1 — Join via Headway</h2>
        <p className="account-readonly">
          Confirms your trading account — doesn't grant Pro/VIP on its own.
        </p>
        <a href={HEADWAY_LINK} target="_blank" rel="noreferrer">Register on Headway</a>
        <HeadwaySwitchNote />
        <form onSubmit={submitHeadway}>
          <input
            placeholder="Your Headway account email/ID"
            value={headwayIdentifier}
            onChange={(e) => setHeadwayIdentifier(e.target.value)}
            required
          />
          <button type="submit" disabled={submitting}>Submit for verification</button>
        </form>
      </section>

      <section>
        <h2>Option 2 — Paid membership</h2>
        {prices ? (
          <div className="tier-upgrade-grid">
            <div className="tier-upgrade-card">
              <h3>Pro</h3>
              <p>Full signals, advanced analysis</p>
              <ManualPaymentFlow purpose="membership" targetTier="pro" billingPeriod="monthly" price={prices.pro.monthly} label={`$${prices.pro.monthly}/month`} />
              <ManualPaymentFlow purpose="membership" targetTier="pro" billingPeriod="lifetime" price={prices.pro.lifetime} label={`$${prices.pro.lifetime} lifetime`} />
            </div>
            <div className="tier-upgrade-card featured">
              <h3>VIP</h3>
              <p>All markets, AI analysis, priority support</p>
              <ManualPaymentFlow purpose="membership" targetTier="vip" billingPeriod="monthly" price={prices.vip.monthly} label={`$${prices.vip.monthly}/month`} />
              <ManualPaymentFlow purpose="membership" targetTier="vip" billingPeriod="lifetime" price={prices.vip.lifetime} label={`$${prices.vip.lifetime} lifetime`} />
            </div>
          </div>
        ) : (
          <p>Loading prices…</p>
        )}
      </section>

      {message && <p>{message}</p>}
    </div>
  );
}
