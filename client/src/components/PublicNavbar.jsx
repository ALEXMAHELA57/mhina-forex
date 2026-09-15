import { useState } from 'react';
import { Link } from 'react-router-dom';

const SECTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'academy', label: 'Academy' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'signals', label: 'Signals' },
  { id: 'ai-analyzer', label: 'AI Analyzer' },
  { id: 'community', label: 'Community' },
  { id: 'contact', label: 'Contact' },
];

export default function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  // The whole public site is one continuous scrolling page now — these
  // links jump to an anchor on the SAME page instead of routing
  // elsewhere. A plain <a href="#id"> plus `scroll-behavior: smooth` on
  // <html> (in index.css) handles the smooth-scroll natively, no JS
  // scroll library needed.
  return (
    <nav className="public-navbar">
      <div className="public-navbar-row">
        <a href="#home" className="brand" onClick={() => setMenuOpen(false)}>
          <img src="/logo.png" alt="MHINA FOREX" className="brand-logo" />
        </a>

        <div className="public-navbar-links desktop-only">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}>{s.label}</a>
          ))}
        </div>
        <div className="public-navbar-actions desktop-only">
          <Link to="/login">Login</Link>
          <Link to="/register" className="btn-primary">Register</Link>
        </div>

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
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={() => setMenuOpen(false)}>{s.label}</a>
          ))}
          <div className="mobile-menu-actions">
            <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
            <Link to="/register" className="btn-primary" onClick={() => setMenuOpen(false)}>Register</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
