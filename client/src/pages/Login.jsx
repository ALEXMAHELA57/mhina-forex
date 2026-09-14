import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import SocialLoginButtons from '../components/SocialLoginButtons.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setError(error.message);
    navigate('/post-login');
  }

  return (
    <div className="auth-page">
      <h1>Login</h1>

      <SocialLoginButtons />

      <div className="auth-divider"><span>or with email</span></div>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <PasswordInput placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
      </form>
      <p><Link to="/forgot-password">Forgot password?</Link></p>
      <p>No account? <Link to="/register">Register</Link></p>
    </div>
  );
}
