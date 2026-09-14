import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import SocialLoginButtons from '../components/SocialLoginButtons.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    // The `handle_new_user` DB trigger (db/03_triggers.sql) auto-creates
    // the profiles row using this metadata — nothing else to call here.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, username } },
    });

    if (error) return setError(error.message);

    // If Supabase's "Confirm email" setting is on, signUp() succeeds but
    // returns NO session until the user clicks the emailed link — trying
    // to navigate into a protected page right now would just bounce them
    // straight back out. Show a clear message instead of a silent no-op.
    if (!data.session) {
      setCheckEmail(true);
      return;
    }

    navigate('/post-login');
  }

  if (checkEmail) {
    return (
      <div className="auth-page">
        <h1>Check your email</h1>
        <p>We've sent a confirmation link to {email}. Click it, then come back and log in.</p>
        <p><Link to="/login">Back to login</Link></p>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <h1>Create your MHINA FOREX account</h1>

      <SocialLoginButtons />

      <div className="auth-divider"><span>or with email</span></div>
      <form onSubmit={handleSubmit}>
        <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <PasswordInput placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="error">{error}</p>}
        <button type="submit">Create Account</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}
