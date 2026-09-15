import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useProfile } from '../lib/useProfile.js';

export default function Navbar() {
  const { profile } = useProfile();
  const isStaff = profile && ['moderator', 'admin', 'super_admin'].includes(profile.role);
  const [menuOpen, setMenuOpen] = useState(false);

  function logout() {
    setMenuOpen(false);
    supabase.auth.signOut();
  }

  const links = (
    <>
      <NavLink to="/app/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
      <NavLink to="/app/academy" onClick={() => setMenuOpen(false)}>Academy</NavLink>
      <NavLink to="/app/signals" onClick={() => setMenuOpen(false)}>Signals</NavLink>
      <NavLink to="/app/market" onClick={() => setMenuOpen(false)}>Market & News</NavLink>
      <NavLink to="/app/ai-analyzer" onClick={() => setMenuOpen(false)}>AI Analyzer</NavLink>
      <NavLink to="/app/community" onClick={() => setMenuOpen(false)}>Community</NavLink>
      <NavLink to="/app/membership" onClick={() => setMenuOpen(false)}>Upgrade</NavLink>
      <NavLink to="/app/account" onClick={() => setMenuOpen(false)}>Account</NavLink>
      <NavLink to="/app/live-sessions" onClick={() => setMenuOpen(false)}>Live Sessions</NavLink>
      {isStaff && <NavLink to="/app/admin" onClick={() => setMenuOpen(false)}>Admin Panel</NavLink>}
      <Link to="/" onClick={() => setMenuOpen(false)}>Public Site</Link>
    </>
  );

  return (
    <nav className="navbar">
      <div className="navbar-row">
        <Link to="/app/dashboard" className="brand" onClick={() => setMenuOpen(false)}>
          <img src="/logo.png" alt="MHINA FOREX" className="brand-logo" />
        </Link>

        <div className="navbar-links desktop-only">{links}</div>
        <button className="desktop-only" onClick={logout}>Logout</button>

        <button
          className="mobile-menu-toggle mobile-only"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu-panel">
          {links}
          <button onClick={logout} className="mobile-logout-btn">Logout</button>
        </div>
      )}
    </nav>
  );
}
