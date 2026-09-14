import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setSent(true);
    setSubmitting(false);
  }

  if (sent) {
    return (
      <div className="auth-page">
        <h1>Check your email</h1>
        <p>We've sent a password reset link to {email}.</p>
        <p><Link to="/login">Back to login</Link></p>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <h1>Reset your password</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send reset link'}</button>
      </form>
      <p><Link to="/login">Back to login</Link></p>
    </div>
  );
}
