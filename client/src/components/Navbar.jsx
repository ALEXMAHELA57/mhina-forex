import { Link, NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useProfile } from '../lib/useProfile.js';

export default function Navbar() {
  const { profile } = useProfile();
  const isStaff = profile && ['moderator', 'admin', 'super_admin'].includes(profile.role);

  return (
    <nav className="navbar">
      <Link to="/app/dashboard" className="brand">
        <img src="/logo.png" alt="MHINA FOREX" className="brand-logo" />
      </Link>
      <NavLink to="/app/dashboard">Dashboard</NavLink>
      <NavLink to="/app/academy">Academy</NavLink>
      <NavLink to="/app/signals">Signals</NavLink>
      <NavLink to="/app/market">Market & News</NavLink>
      <NavLink to="/app/ai-analyzer">AI Analyzer</NavLink>
      <NavLink to="/app/community">Community</NavLink>
      <NavLink to="/app/membership">Upgrade</NavLink>
      <NavLink to="/app/account">Account</NavLink>
      <NavLink to="/app/live-sessions">Live Sessions</NavLink>
      {isStaff && <NavLink to="/app/admin">Admin Panel</NavLink>}
      <Link to="/">Public Site</Link>
      <button onClick={() => supabase.auth.signOut()}>Logout</button>
    </nav>
  );
}
