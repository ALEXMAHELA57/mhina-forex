export default function PublicContact() {
  return (
    <div className="public-page">
      <section className="hero">
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
