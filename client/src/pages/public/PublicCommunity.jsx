import { Link } from 'react-router-dom';

export default function PublicCommunity() {
  return (
    <div className="public-page">
      <section className="hero">
        <h1>Learn together. Trade together.</h1>
        <p className="hero-sub">
          Share your charts, get feedback from other traders, and follow
          setups from the community. Real trades, real discussion not
          just signals.
        </p>
      </section>

      <section className="showcase-list contained">
        <div className="showcase-row">
          <h3>Share your analysis</h3>
          <p>Post a chart, explain your read on the market, and get reactions from other traders working the same setups.</p>
        </div>
      </section>

      <section className="cta-band">
        <Link to="/register" className="btn-primary">Join the community</Link>
        <p style={{ marginTop: '16px' }}>
          <a href="https://t.me/mhinaforex" target="_blank" rel="noreferrer">
            Or join our Telegram for real-time discussion →
          </a>
        </p>
      </section>
    </div>
  );
}
