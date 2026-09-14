import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="public-home">
      <section className="hero">
        <h1>Learn. Analyze. Trade. Grow.</h1>
        <p className="hero-sub">
          Structured Forex education, real market analysis, and trading
          signals built from experience not guesswork.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn-primary">Get started</Link>
          <Link to="/about">Our story</Link>
        </div>
      </section>

      <section className="showcase">
        <div className="showcase-featured">
          <span className="showcase-tag">AI-powered</span>
          <h2>AI Chart Analyzer</h2>
          <p>Upload a chart and get structured analysis not a guess, a framework: structure, key level, confirmation, then entry, stop loss, and take profit. If the setup isn't clear, it tells you that too.</p>

          <div className="example-signal">
            <div className="example-signal-header">
              <span className="pair">XAUUSD</span>
              <span className="direction buy">BUY</span>
            </div>
            <div className="example-signal-levels">
              <div><span className="label">Entry</span><span className="value">2,468.50</span></div>
              <div><span className="label">Stop Loss</span><span className="value">2,460.00</span></div>
              <div><span className="label">Take Profit</span><span className="value">2,485.00</span></div>
            </div>
            <span className="example-signal-caption">Example output — illustrative, not a live signal</span>
          </div>
        </div>

        <div className="showcase-list">
          <div className="showcase-row">
            <h3>Academy</h3>
            <p>Beginner to advanced courses on market structure, risk management, and trading psychology.</p>
          </div>
          <div className="showcase-row">
            <h3>Market Analysis</h3>
            <p>Daily key levels, trend bias, and outlook across Gold, Forex pairs, crypto, and indices.</p>
          </div>
          <div className="showcase-row">
            <h3>Trading Signals</h3>
            <p>Clear entry, stop loss, and take profit levels with the reasoning behind each call.</p>
          </div>
          <div className="showcase-row">
            <h3>Community</h3>
            <p>Share setups, get feedback, and learn alongside traders working through the same markets.</p>
          </div>
          <div className="showcase-row">
            <h3>Live Sessions</h3>
            <p>Mentorship calls and live broadcast classes real trades, explained as they happen.</p>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <p>Discipline today, creates freedom tomorrow.</p>
        <Link to="/register" className="btn-primary">Create your account</Link>
      </section>
    </div>
  );
}
