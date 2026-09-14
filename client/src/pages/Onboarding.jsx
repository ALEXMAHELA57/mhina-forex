import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { supabase } from '../lib/supabaseClient.js';
import { useProfile } from '../lib/useProfile.js';
import HeadwaySwitchNote from '../components/HeadwaySwitchNote.jsx';

const HEADWAY_LINK = import.meta.env.VITE_HEADWAY_REFERRAL_LINK
  || 'https://headway.partners/user/signup?hwp=dfe932';

/**
 * Shown once, right after registration — before landing on the
 * dashboard. Not a gate (Free tier is usable regardless, per the
 * access-model change) — just the best moment to prompt people toward
 * the Headway referral link, while they're already mid-signup.
 * "Continue" marks has_completed_onboarding so future logins (through
 * ANY path) skip straight to the dashboard instead of showing this again.
 */
export default function Onboarding() {
  const { profile } = useProfile();
  const [headwayIdentifier, setHeadwayIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  async function submitHeadway(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/headway/submit', { headwayIdentifier });
      setMessage('Submitted — an admin will verify it shortly.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function continueToApp() {
    if (profile) {
      await supabase.from('profiles').update({ has_completed_onboarding: true }).eq('id', profile.id);
    }
    navigate('/app/dashboard');
  }

  return (
    <div className="access-gate">
      <h1>Welcome to MHINA FOREX</h1>

      <section>
        <h2>One more thing before you dive in</h2>
        <p className="account-readonly">
          If you don't already have a trading account, open one through
          our partner Headway — it's how a lot of what we build here
          gets funded, and it costs you nothing extra.
        </p>
        <a href={HEADWAY_LINK} target="_blank" rel="noreferrer" className="btn-primary">
          Open a Headway account
        </a>
        <HeadwaySwitchNote />

        <form onSubmit={submitHeadway} style={{ marginTop: '16px' }}>
          <input
            placeholder="Already have one? Enter your Headway account email/ID"
            value={headwayIdentifier}
            onChange={(e) => setHeadwayIdentifier(e.target.value)}
          />
          <button type="submit" disabled={submitting || !headwayIdentifier}>Submit for verification</button>
        </form>
        {message && <p>{message}</p>}
      </section>

      <button onClick={continueToApp} className="onboarding-skip">
        Continue to Dashboard →
      </button>
    </div>
  );
}
