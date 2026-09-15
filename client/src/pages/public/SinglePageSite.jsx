import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../lib/api.js';
import TradingViewTicker from '../../components/TradingViewTicker.jsx';
import TradingViewCalendar from '../../components/TradingViewCalendar.jsx';
import HeadwaySwitchNote from '../../components/HeadwaySwitchNote.jsx';

const HEADWAY_LINK = import.meta.env.VITE_HEADWAY_REFERRAL_LINK
  || 'https://headway.partners/user/signup?hwp=dfe932';

const SAMPLE_SIGNALS = [
  { pair: 'XAUUSD', direction: 'buy', entry: '2,468.50', sl: '2,460.00', tp: '2,485.00', rr: '1:3.4' },
  { pair: 'EUR/USD', direction: 'sell', entry: '1.1020', sl: '1.1060', tp: '1.0960', rr: '1:2.0' },
  { pair: 'GBP/USD', direction: 'buy', entry: '1.3124', sl: '1.3060', tp: '1.3200', rr: '1:2.1' },
];

/**
 * The whole public marketing site as ONE continuous scrolling page —
 * Home flows straight into About, Academy, Analysis, Signals, AI
 * Analyzer, Community, and Contact, each as an anchored <section>.
 * The navbar's links scroll to these anchors instead of routing to
 * separate pages (see PublicNavbar.jsx).
 */
export default function SinglePageSite() {
  const [courses, setCourses] = useState(null);
  const [coursesError, setCoursesError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    api.get('/public-courses').then((res) => setCourses(res.courses)).catch((err) => setCoursesError(err.message));
  }, []);

  // Scrolls to the right section when landing on a URL with a hash —
  // needed both for the old individual page redirects (/about -> /#about)
  // and for anyone directly visiting/bookmarking a link with a hash,
  // since client-side routing doesn't auto-scroll to hashes the way a
  // normal full-page navigation would.
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) {
        // Small delay lets the page finish laying out first (especially
        // important right after a redirect) before scrolling.
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    }
  }, [location]);

  return (
    <div className="public-home">
      {/* ---------- HOME ---------- */}
      <section id="home" className="hero">
        <h1>Learn. Analyze. Trade. Grow.</h1>
        <p className="hero-sub">
          Structured Forex education, real market analysis, and trading
          signals built from experience not guesswork.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn-primary">Get started</Link>
          <a href="#about">Our story</a>
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
            <span className="example-signal-caption">Example output illustrative, not a live signal</span>
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

      {/* ---------- ABOUT ---------- */}
      <section id="about" className="hero hero-pattern-bg">
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

      {/* ---------- ACADEMY ---------- */}
      <section id="academy" className="hero hero-bold hero-pattern-bg">
        <h1>
          <span className="hero-line-1">Learn the market.</span>
          <span className="hero-line-2">Not just theory.</span>
        </h1>
        <p className="hero-sub">
          Built from real trading experience, not textbooks a clear
          path from beginner to advanced.
        </p>
      </section>

      {coursesError && <p className="error">{coursesError}</p>}
      {courses && courses.length === 0 && <p className="empty-note" style={{ textAlign: 'center' }}>Courses are coming soon.</p>}

      <section className="paths-grid">
        {courses?.map((c) => (
          <div key={c.id} className="path-card">
            <span className="path-level">{c.level}</span>
            <h3>{c.title}</h3>
            <p>{c.description}</p>
            <p className="course-price-line">
              {c.price ? `$${c.price}` : `Included in ${c.required_tier.toUpperCase()} membership`}
            </p>
            <Link to="/register" className="btn-primary">Enroll</Link>
          </div>
        ))}
      </section>

      {/* ---------- ANALYSIS ---------- */}
      <section id="analysis" className="hero hero-pattern-bg">
        <h1>Understand the market. Trade with confidence.</h1>
        <p className="hero-sub">
          Live prices and the economic calendar that actually moves them
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
          <p>Real, live-updating events CPI, interest rate decisions, non-farm payrolls — as they're released, not a static list.</p>
        </div>
      </section>

      <section className="widget-section">
        <TradingViewCalendar />
      </section>

      <section className="showcase-list contained">
        <div className="showcase-row">
          <h3>Our own market outlook</h3>
          <p>Beyond the raw data our written analysis of structure, key levels, and bias for major instruments, available to registered members.</p>
        </div>
      </section>

      <section className="cta-band">
        <Link to="/register" className="btn-primary">Get full access</Link>
      </section>

      {/* ---------- SIGNALS ---------- */}
      <section id="signals" className="hero hero-pattern-bg">
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
        <span className="example-signal-caption">Example signals shown for illustration live signals require an active membership.</span>
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

      {/* ---------- AI ANALYZER ---------- */}
      <section id="ai-analyzer" className="hero hero-pattern-bg">
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

      {/* ---------- COMMUNITY ---------- */}
      <section id="community" className="hero hero-pattern-bg">
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

      {/* ---------- CONTACT ---------- */}
      <section id="contact" className="hero hero-pattern-bg">
        <h1>Get in touch</h1>
        <p className="hero-sub">
          Questions about courses, signals, or your account? Reach out —
          we're happy to help.
        </p>
      </section>

      <section className="showcase-list contained">
        <div className="showcase-row">
          <h3>Email</h3>
          {/* TODO: replace with your real support address */}
          <p>support@mhinaforex.com</p>
        </div>
        <div className="showcase-row">
          <h3>Telegram</h3>
          {/* TODO: replace with your real channel link */}
          <p>t.me/mhinaforex</p>
        </div>
      </section>
    </div>
  );
}
