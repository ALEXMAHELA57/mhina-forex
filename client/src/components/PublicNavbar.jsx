import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="public-navbar">
      <div className="public-navbar-row">
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <img src="/logo.png" alt="MHINA FOREX" className="brand-logo" />
        </Link>

        {/* Desktop links — hidden on mobile via CSS media query */}
        <div className="public-navbar-links desktop-only">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/academy">Academy</NavLink>
          <NavLink to="/analysis">Analysis</NavLink>
          <NavLink to="/signals">Signals</NavLink>
          <NavLink to="/ai-analyzer">AI Analyzer</NavLink>
          <NavLink to="/community">Community</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </div>
        <div className="public-navbar-actions desktop-only">
          <Link to="/login">Login</Link>
          <Link to="/register" className="btn-primary">Register</Link>
        </div>

        {/* Mobile hamburger — hidden on desktop via CSS media query */}
        <button
          className="mobile-menu-toggle mobile-only"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown panel — only rendered when open, sits BELOW the
          navbar row in normal document flow, so it pushes content down
          instead of overlapping the hero underneath it. */}
      {menuOpen && (
        <div className="mobile-menu-panel">
          <NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink>
          <NavLink to="/about" onClick={() => setMenuOpen(false)}>About</NavLink>
          <NavLink to="/academy" onClick={() => setMenuOpen(false)}>Academy</NavLink>
          <NavLink to="/analysis" onClick={() => setMenuOpen(false)}>Analysis</NavLink>
          <NavLink to="/signals" onClick={() => setMenuOpen(false)}>Signals</NavLink>
          <NavLink to="/ai-analyzer" onClick={() => setMenuOpen(false)}>AI Analyzer</NavLink>
          <NavLink to="/community" onClick={() => setMenuOpen(false)}>Community</NavLink>
          <NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink>
          <div className="mobile-menu-actions">
            <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
            <Link to="/register" className="btn-primary" onClick={() => setMenuOpen(false)}>Register</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
