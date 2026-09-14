import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../lib/useProfile.js';

/**
 * The single landing point every login path routes through — regular
 * email/password, post-email-confirmation, and Google OAuth alike —
 * so onboarding only ever gets skipped when it's genuinely already been
 * seen, not just because of which specific path someone logged in through.
 */
export default function PostAuthRedirect() {
  const { profile, loading } = useProfile();
  const navigate = useNavigate();
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    // Right after a Google redirect, Supabase needs a moment to exchange
    // the URL's auth code for a real session — checking "is there a
    // session?" too early (before that exchange finishes) sees nothing
    // and would otherwise bounce a SUCCESSFUL Google sign-in straight
    // back to /login. Give it a short grace window before concluding
    // "genuinely not logged in".
    const timer = setTimeout(() => setWaited(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!profile) {
      if (!waited) return; // still might be mid-exchange — don't bail early
      navigate('/login', { replace: true });
      return;
    }
    navigate(profile.has_completed_onboarding ? '/app/dashboard' : '/onboarding', { replace: true });
  }, [profile, loading, waited, navigate]);

  return <p>Signing you in…</p>;
}
