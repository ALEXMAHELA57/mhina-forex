import { Link, NavLink } from 'react-router-dom';

export default function PublicNavbar() {
  return (
    <nav className="public-navbar">
      <Link to="/" className="brand">
        <img src="/logo.png" alt="MHINA FOREX" className="brand-logo" />
      </Link>
      <div className="public-navbar-links">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/about">About</NavLink>
        <NavLink to="/academy">Academy</NavLink>
        <NavLink to="/analysis">Analysis</NavLink>
        <NavLink to="/signals">Signals</NavLink>
        <NavLink to="/ai-analyzer">AI Analyzer</NavLink>
        <NavLink to="/community">Community</NavLink>
        <NavLink to="/contact">Contact</NavLink>
      </div>
      <div className="public-navbar-actions">
        <Link to="/login">Login</Link>
        <Link to="/register" className="btn-primary">Register</Link>
      </div>
    </nav>
  );
}
