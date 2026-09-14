import HeadwaySwitchNote from '../../components/HeadwaySwitchNote.jsx';

const HEADWAY_LINK = import.meta.env.VITE_HEADWAY_REFERRAL_LINK
  || 'https://headway.partners/user/signup?hwp=dfe932';

export default function PublicHeadway() {
  return (
    <div className="public-page">
      <section className="hero hero-pattern-bg">
        <h1>Ready to start trading?</h1>
        <p className="hero-sub">
          Open your trading account through our partner, Headway, and begin
          your trading journey.
        </p>
        <div className="hero-actions">
          <a href={HEADWAY_LINK} target="_blank" rel="noreferrer" className="btn-primary">
            Open a Headway account
          </a>
        </div>
        <HeadwaySwitchNote />
      </section>
    </div>
  );
}
