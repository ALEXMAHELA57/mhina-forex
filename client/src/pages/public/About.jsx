import HeadwaySwitchNote from '../../components/HeadwaySwitchNote.jsx';

const HEADWAY_LINK = import.meta.env.VITE_HEADWAY_REFERRAL_LINK
  || 'https://headway.partners/user/signup?hwp=dfe932';

export default function About() {
  return (
    <div className="public-about">
      <section className="hero hero-pattern-bg">
        <h1>From a trading journey to a trading community</h1>
        <p className="hero-sub">
          MHINA FOREX is a Forex trading platform built from years of
          experience, learning, and dedication to the financial markets.
          Our journey began in 2017, and on 4 December 2018 we launched
          the MHINA FOREX Telegram channel, where we started providing
          Forex education, market analysis, and trading signals. Today,
          our vision goes beyond signals we aim to help traders develop
          the knowledge, discipline, and confidence they need to
          understand the market and make better trading decisions.
        </p>
      </section>

      <section className="mission-grid">
        <div className="mission-card">
          <h3>Our Mission</h3>
          <p>To equip traders with practical knowledge, real market insights, and discipline for long-term success.</p>
        </div>
        <div className="mission-card">
          <h3>Our Vision</h3>
          <p>To become a leading Forex education and trading platform recognized globally for integrity, impact, and results.</p>
        </div>
        <div className="mission-card">
          <h3>Our Values</h3>
          <ul>
            <li>Integrity</li>
            <li>Discipline</li>
            <li>Transparency</li>
            <li>Community</li>
            <li>Growth</li>
          </ul>
        </div>
      </section>

      <section className="timeline">
        <h2>Key moments in our story</h2>
        <div className="timeline-grid">
          <div className="timeline-item">
            <span className="timeline-year">2017</span>
            <p>Started Forex journey began learning, studying, and understanding the financial markets.</p>
          </div>
          <div className="timeline-item">
            <span className="timeline-year">4 Dec 2018</span>
            <p>MHINA FOREX Telegram was launched, marking the beginning of our journey to provide Forex education, analysis, and trading signals.</p>
          </div>
          <div className="timeline-item">
            <span className="timeline-year">Today</span>
            <p>Growing together education, analysis, signals, community, and technology, all in one place.</p>
          </div>
          <div className="timeline-item">
            <span className="timeline-year">The future</span>
            <p>MHINA FOREX Web Platform a complete platform for every trader, with advanced tools, AI analysis, and more.</p>
          </div>
        </div>
      </section>

      <section className="headway-cta">
        <h2>Ready to start trading?</h2>
        <p>
          Open your trading account through our partner, Headway, and begin
          your trading journey.
        </p>
        <a href={HEADWAY_LINK} target="_blank" rel="noreferrer" className="btn-primary">
          Open a Headway account
        </a>
        <HeadwaySwitchNote />
      </section>
    </div>
  );
}
