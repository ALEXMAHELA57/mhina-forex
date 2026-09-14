import { useState } from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { supabase } from '../lib/supabaseClient.js';

/**
 * Two-step phone sign-in: enter phone (with country code, via the phone
 * input's country selector) -> receive SMS code -> enter code -> verify.
 * Supabase's phone auth doesn't distinguish login from signup — a new
 * account is created automatically on first verification, same as
 * Google/Apple, via the handle_new_user DB trigger.
 * Requires an SMS provider (e.g. Twilio) configured in Supabase's
 * dashboard — see the setup note wherever this is used.
 */
export default function PhoneAuth() {
  const [phone, setPhone] = useState();
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'code'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function sendCode(e) {
    e.preventDefault();
    if (!phone) {
      setError('Enter a phone number, including country code');
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) setError(error.message);
    else setStep('code');
    setSubmitting(false);
  }

  async function verifyCode(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
    if (error) setError(error.message);
    // On success, Supabase's auth listener (useProfile hook) picks up the
    // new session automatically — no manual redirect needed here.
    setSubmitting(false);
  }

  if (step === 'code') {
    return (
      <form onSubmit={verifyCode} className="phone-auth-form">
        <p className="phone-auth-hint">Code sent to {phone}</p>
        <input
          placeholder="6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <button type="submit" disabled={submitting}>{submitting ? 'Verifying…' : 'Verify code'}</button>
        {error && <p className="error">{error}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="phone-auth-form">
      <PhoneInput
        international
        defaultCountry="TZ"
        placeholder="Phone number"
        value={phone}
        onChange={setPhone}
      />
      <button type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send code'}</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
