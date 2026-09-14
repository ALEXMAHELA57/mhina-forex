import { Link } from 'react-router-dom';

const SAMPLE_SIGNALS = [
  { pair: 'XAUUSD', direction: 'buy', entry: '2,468.50', sl: '2,460.00', tp: '2,485.00', rr: '1:3.4' },
  { pair: 'EUR/USD', direction: 'sell', entry: '1.1020', sl: '1.1060', tp: '1.0960', rr: '1:2.0' },
  { pair: 'GBP/USD', direction: 'buy', entry: '1.3124', sl: '1.3060', tp: '1.3200', rr: '1:2.1' },
];

export default function PublicSignals() {
  return (
    <div className="public-page">
      <section className="hero">
        <h1>Proven setups. Real opportunities.</h1>
        <p className="hero-sub">
          High-quality trading setups with clear entry, stop loss, and take
          profit levels. Every signal is based on market analysis, not
          guesswork.
        </p>
      </section>

      <section className="sample-signals">
        {SAMPLE_SIGNALS.map((s) => (
          <div key={s.pair} className="signal-card">
            <div className="example-signal-header">
              <span className="pair">{s.pair}</span>
              <span className={`direction ${s.direction}`}>{s.direction.toUpperCase()}</span>
            </div>
            <div className="example-signal-levels">
              <div><span className="label">Entry</span><span className="value">{s.entry}</span></div>
              <div><span className="label">Stop Loss</span><span className="value">{s.sl}</span></div>
              <div><span className="label">Take Profit</span><span className="value">{s.tp}</span></div>
              <div><span className="label">Risk/Reward</span><span className="value">{s.rr}</span></div>
            </div>
          </div>
        ))}
        <span className="example-signal-caption">Example signals shown for illustration — live signals require an active membership.</span>
      </section>

      <section className="pricing-tiers">
        <div className="tier-card">
          <h3>Free</h3>
          <p>Limited signals, basic analysis</p>
        </div>
        <div className="tier-card featured">
          <h3>Pro</h3>
          <p>Full signals, advanced analysis</p>
        </div>
        <div className="tier-card">
          <h3>VIP</h3>
          <p>All markets, AI analysis, priority support</p>
        </div>
      </section>

      <section className="cta-band">
        <Link to="/register" className="btn-primary">Join premium signals</Link>
      </section>
    </div>
  );
}
