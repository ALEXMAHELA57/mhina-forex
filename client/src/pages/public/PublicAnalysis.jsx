import { Link } from 'react-router-dom';
import TradingViewTicker from '../../components/TradingViewTicker.jsx';
import TradingViewCalendar from '../../components/TradingViewCalendar.jsx';

export default function PublicAnalysis() {
  return (
    <div className="public-page">
      <section className="hero hero-pattern-bg">
        <h1>Understand the market. Trade with confidence.</h1>
        <p className="hero-sub">
          Live prices and the economic calendar that actually moves them —
          plus our own written market outlook once you're inside the
          platform.
        </p>
      </section>

      <section className="widget-section">
        <TradingViewTicker />
      </section>

      <section className="showcase-list contained">
        <div className="showcase-row">
          <h3>Live economic calendar</h3>
          <p>Real, live-updating events — CPI, interest rate decisions, non-farm payrolls — as they're released, not a static list.</p>
        </div>
      </section>

      <section className="widget-section">
        <TradingViewCalendar />
      </section>

      <section className="showcase-list contained">
        <div className="showcase-row">
          <h3>Our own market outlook</h3>
          <p>Beyond the raw data — our written analysis of structure, key levels, and bias for major instruments, available to registered members.</p>
        </div>
      </section>

      <section className="cta-band">
        <Link to="/register" className="btn-primary">Get full access</Link>
      </section>
    </div>
  );
}
