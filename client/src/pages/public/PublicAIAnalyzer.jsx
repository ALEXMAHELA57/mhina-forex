import { Link } from 'react-router-dom';

export default function PublicAIAnalyzer() {
  return (
    <div className="public-page">
      <section className="hero hero-pattern-bg">
        <h1>Upload a chart. Get a structured read.</h1>
        <p className="hero-sub">
          Our AI Chart Analyzer breaks down any chart the same way a
          disciplined trader would structure, key level, confirmation,
          then entry, stop loss, and take profit. If there's no clear
          setup, it says so instead of forcing a trade.
        </p>
      </section>

      <section className="showcase-featured standalone">
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
      </section>

      <section className="cta-band">
        <Link to="/register" className="btn-primary">Try the AI Analyzer</Link>
      </section>
    </div>
  );
}
