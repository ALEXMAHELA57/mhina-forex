import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import PasswordInput from '../components/PasswordInput.jsx';

/**
 * Reached via the link in the password-reset email. Supabase's client
 * automatically exchanges the link's token for a temporary recovery
 * session on page load — this form just calls updateUser with the new
 * password against that session.
 */
export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) return setError(error.message);
    navigate('/app/dashboard');
  }

  return (
    <div className="auth-page">
      <h1>Set a new password</h1>
      <form onSubmit={handleSubmit}>
        <PasswordInput placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <PasswordInput placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Set new password'}</button>
      </form>
    </div>
  );
}
