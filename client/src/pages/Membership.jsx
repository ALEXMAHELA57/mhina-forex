import { useEffect, useState } from 'react';
import { useProfile } from '../lib/useProfile.js';
import { api } from '../lib/api.js';
import ManualPaymentFlow from '../components/ManualPaymentFlow.jsx';
import HeadwaySwitchNote from '../components/HeadwaySwitchNote.jsx';

const TIER_RANK = { free: 0, pro: 1, vip: 2 };
const HEADWAY_LINK = import.meta.env.VITE_HEADWAY_REFERRAL_LINK
  || 'https://headway.partners/user/signup?hwp=dfe932';

export default function Membership() {
  const { profile } = useProfile();
  const [prices, setPrices] = useState(null);
  const [headwayIdentifier, setHeadwayIdentifier] = useState('');
  const [headwaySubmitting, setHeadwaySubmitting] = useState(false);
  const [headwayMessage, setHeadwayMessage] = useState(null);

  useEffect(() => {
    api.get('/manual-payments/instructions').then((res) => setPrices(res.prices));
  }, []);

  async function submitHeadway(e) {
    e.preventDefault();
    setHeadwaySubmitting(true);
    try {
      await api.post('/headway/submit', { headwayIdentifier });
      setHeadwayMessage('Submitted — an admin will verify your Headway account shortly.');
    } catch (err) {
      setHeadwayMessage(err.message);
    } finally {
      setHeadwaySubmitting(false);
    }
  }

  if (!profile || !prices) return <p>Loading…</p>;

  const currentRank = TIER_RANK[profile.membership_tier] ?? 0;

  return (
    <div className="membership-page">
      <h1>Membership</h1>
      <p className="course-meta">
        Current tier: <strong>{profile.membership_tier.toUpperCase()}</strong>
      </p>

      <div className="tier-upgrade-grid">
        <div className="tier-upgrade-card">
          <h3>Pro</h3>
          <p>Full signals, advanced analysis</p>
          {currentRank >= TIER_RANK.pro ? (
            <p className="already-have">You already have Pro access</p>
          ) : (
            <>
              <ManualPaymentFlow purpose="membership" targetTier="pro" billingPeriod="monthly" price={prices.pro.monthly} label={`$${prices.pro.monthly}/month`} />
              <ManualPaymentFlow purpose="membership" targetTier="pro" billingPeriod="lifetime" price={prices.pro.lifetime} label={`$${prices.pro.lifetime} lifetime`} />
            </>
          )}
        </div>

        <div className="tier-upgrade-card featured">
          <h3>VIP</h3>
          <p>All markets, AI analysis, priority support</p>
          {currentRank >= TIER_RANK.vip ? (
            <p className="already-have">You already have VIP access</p>
          ) : (
            <>
              <ManualPaymentFlow purpose="membership" targetTier="vip" billingPeriod="monthly" price={prices.vip.monthly} label={`$${prices.vip.monthly}/month`} />
              <ManualPaymentFlow purpose="membership" targetTier="vip" billingPeriod="lifetime" price={prices.vip.lifetime} label={`$${prices.vip.lifetime} lifetime`} />
            </>
          )}
        </div>
      </div>

      <section className="account-section">
        <h2>Or verify via Headway</h2>
        <p className="account-readonly">
          Already trading through Headway, or want to open an account there?
          Verifying your Headway account confirms your trading account — it
          doesn't change your membership tier on its own. If you want Pro
          or VIP features, choose one of the plans above.
        </p>
        <a href={HEADWAY_LINK} target="_blank" rel="noreferrer">Register on Headway</a>
        <HeadwaySwitchNote />
        <form onSubmit={submitHeadway} style={{ marginTop: '12px' }}>
          <input
            placeholder="Your Headway account email/ID"
            value={headwayIdentifier}
            onChange={(e) => setHeadwayIdentifier(e.target.value)}
            required
          />
          <button type="submit" disabled={headwaySubmitting}>Submit for verification</button>
        </form>
        {headwayMessage && <p>{headwayMessage}</p>}
      </section>
    </div>
  );
}
