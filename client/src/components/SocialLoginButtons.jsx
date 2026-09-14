import { supabase } from '../lib/supabaseClient.js';

/**
 * Google OAuth button — used on both Login and Register, since
 * Supabase's OAuth flow itself doesn't distinguish "sign up" from
 * "sign in": a new account is created automatically on first use,
 * same as email.
 * Apple sign-in is left out for now (requires a paid $99/year Apple
 * Developer account) — add it back the same way once that's set up.
 */
export default function SocialLoginButtons() {
  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/post-login` },
    });
  }

  return (
    <div className="social-login-buttons">
      <button type="button" onClick={signInWithGoogle} className="social-btn google-btn">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.92c1.7-1.57 2.68-3.88 2.68-6.64z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.17l-2.92-2.27c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.34C2.44 15.98 5.48 18 9 18z"/>
          <path fill="#FBBC05" d="M3.97 10.71A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.71V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.34z"/>
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.95l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"/>
        </svg>
        Continue with Google
      </button>
    </div>
  );
}
