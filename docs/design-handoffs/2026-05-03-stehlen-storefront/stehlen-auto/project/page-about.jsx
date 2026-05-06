// ============================================================
// Stehlen Auto — About / Brand Story
// ============================================================
const { I, TrustRow } = window.STEHLEN_UI;

function AboutPage({ onNav, mobile }) {
  return (
    <main>
      {/* HERO */}
      <section style={{
        position: 'relative',
        background: 'var(--c-bg)',
        borderBottom: '1px solid var(--c-border)',
        overflow: 'hidden',
        minHeight: mobile ? 380 : 520,
      }}>
        <img src="assets/hero-stehlen.jpg" alt="" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, var(--c-bg) 35%, transparent 80%)',
        }} />
        <div className="container" style={{ position: 'relative', padding: mobile ? '56px 0' : '120px 0', maxWidth: 980 }}>
          <div className="eyebrow" style={{ color: 'var(--c-accent)', marginBottom: 16 }}>EST. 2015 · CORONA, CA</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 44 : 96, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.92 }}>
            BUILT TOUGH.<br/>BOLT ON.<br/>DRIVE OFF.
          </h1>
          <p style={{ marginTop: 20, fontSize: mobile ? 15 : 18, color: 'var(--c-muted)', maxWidth: 640, lineHeight: 1.55 }}>
            Stehlen Auto makes heavy-duty parts for the people who actually use their trucks. No drilling. No guesswork. Just real-world fitment, backed by a guarantee.
          </p>
        </div>
      </section>

      {/* BIG NUMBERS */}
      <section className="container" style={{ padding: mobile ? '40px 0' : '64px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 20 }}>BY THE NUMBERS</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          borderTop: '1px solid var(--c-border)',
          borderLeft: '1px solid var(--c-border)',
        }}>
          {[
            { n: '300K+', l: 'CUSTOMERS SERVED' },
            { n: '10+',   l: 'YEARS IN BUSINESS' },
            { n: '4.7★',  l: 'AVG. PRODUCT RATING' },
            { n: '48',    l: 'STATES SHIPPED FREE' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: mobile ? 24 : 32,
              borderRight: '1px solid var(--c-border)',
              borderBottom: '1px solid var(--c-border)',
            }}>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 40 : 56, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.n}</div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--c-muted)', marginTop: 8, fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* STORY */}
      <section style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile ? '48px 0' : '96px 0', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1.3fr', gap: 48, alignItems: 'flex-start' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>OUR STORY</div>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 32 : 44, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>
              FROM A CORONA<br/>WAREHOUSE.
            </h2>
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--c-muted)', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <p>Stehlen started in 2015 in a single bay outside Corona, California. The pitch was simple: aftermarket parts that fit the first time, ship fast, and don't fall off the truck a year later.</p>
            <p>For nearly a decade we sold through eBay, building a reputation one fitment at a time. In 2024 we moved direct — same parts, same warehouse, same engineers — minus the marketplace fees.</p>
            <p style={{ color: 'var(--c-text)', fontFamily: 'var(--f-display)', fontSize: 18, lineHeight: 1.5, letterSpacing: '-0.005em' }}>
              "If it doesn't bolt on with hand tools and factory holes, it doesn't ship under our name."
            </p>
            <p style={{ fontSize: 12, color: 'var(--c-muted-2)' }}>— Stehlen engineering rule #1</p>
          </div>
        </div>
      </section>

      {/* VALUES — 3 columns */}
      <section className="container" style={{ padding: mobile ? '48px 0' : '80px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>WHAT WE STAND FOR</div>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 32 : 44, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 40 }}>
          THREE RULES.<br/>NO EXCEPTIONS.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 0, borderTop: '1px solid var(--c-border)' }}>
          {[
            {
              n: '01', t: 'BOLT ON. NO DRILLING.',
              b: 'Every Stehlen part mounts to factory holes with the tools already in your garage. If it requires drilling sheet metal, it doesn\'t ship.',
            },
            {
              n: '02', t: 'GUARANTEED FITMENT.',
              b: 'Our YMM database is hand-verified by our engineers, not scraped. If a part doesn\'t fit your year/make/model, we pay return shipping.',
            },
            {
              n: '03', t: 'BUILT TO STAY ON.',
              b: 'Powder-coated steel and marine-grade aluminum. No fiberglass, no chrome-look plastic. Tested at 65mph for 100,000 miles.',
            },
          ].map((v, i) => (
            <div key={i} style={{
              padding: 32,
              borderRight: !mobile && i < 2 ? '1px solid var(--c-border)' : 0,
              borderBottom: '1px solid var(--c-border)',
            }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--c-accent)', letterSpacing: '0.14em', fontWeight: 700 }}>{v.n}</div>
              <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 22, textTransform: 'uppercase', letterSpacing: '-0.01em', marginTop: 12 }}>{v.t}</h3>
              <p style={{ fontSize: 14, color: 'var(--c-muted)', marginTop: 12, lineHeight: 1.6 }}>{v.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT'S MADE — process */}
      <section style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile ? '48px 0' : '80px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>HOW IT'S MADE</div>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 32 : 44, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 40 }}>
            FROM CAD TO CARGO BED.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { n: '01', t: 'ENGINEER', b: 'In-house CAD against scanned OEM body panels. Every bracket modeled to the millimeter.' },
              { n: '02', t: 'PROTOTYPE', b: 'Test fit on real vehicles in our Corona shop before any tooling is cut.' },
              { n: '03', t: 'MANUFACTURE', b: 'Heavy-gauge cold-rolled steel and 6061 aluminum. Powder-coated, never painted.' },
              { n: '04', t: 'VERIFY', b: 'Final fitment audit on the YMM bench. Every part tagged to its vehicle list.' },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'var(--c-bg)',
                border: '1px solid var(--c-border)',
                borderRadius: 'var(--r-md)',
                padding: 24,
              }}>
                <div className="mono" style={{ fontSize: 11, color: 'var(--c-accent)', letterSpacing: '0.14em', fontWeight: 700 }}>{s.n}</div>
                <h4 style={{ fontFamily: 'var(--f-display)', fontSize: 18, textTransform: 'uppercase', letterSpacing: '-0.005em', marginTop: 10 }}>{s.t}</h4>
                <p style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 10, lineHeight: 1.55 }}>{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CUSTOMER VOICES */}
      <section className="container" style={{ padding: mobile ? '48px 0' : '80px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>FROM THE GARAGE</div>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 32 : 44, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 40 }}>
          REAL TRUCKS. REAL OWNERS.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { stars: 5, q: '"Mounted on the F-250 in under an hour. Every hole lined up perfect — no shimming, no swearing."', a: 'Carlos M.', v: '2020 Ford F-250 · Mesa, AZ' },
            { stars: 5, q: '"Took it through 200 miles of rocky trail on the Wrangler. Didn\'t budge. Not one squeak. Not one rattle."', a: 'Jenna T.', v: '2014 Jeep Wrangler · Moab, UT' },
            { stars: 5, q: '"Called support with a fitment question on a 2008 model. They knew the truck better than I did. Sorted in 8 minutes."', a: 'Tony R.', v: '2008 Chevy Silverado · Reno, NV' },
          ].map((r, i) => (
            <div key={i} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 24 }}>
              <div className="stars" style={{ marginBottom: 14 }}>★★★★★</div>
              <p style={{ fontSize: 16, lineHeight: 1.5, fontFamily: 'var(--f-display)', letterSpacing: '-0.005em' }}>{r.q}</p>
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--c-border)' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{r.a}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', letterSpacing: '0.08em', marginTop: 2 }}>{r.v}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <TrustRow />

      {/* CTA */}
      <section style={{ background: 'var(--c-accent)', color: 'var(--c-accent-ink)' }}>
        <div className="container" style={{ padding: mobile ? '48px 0' : '72px 0', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1.4fr auto', gap: 24, alignItems: 'center' }}>
          <div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 700, marginBottom: 12 }}>READY TO BUILD</div>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 32 : 52, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 0.95 }}>
              FIND PARTS THAT FIT YOUR RIG.
            </h2>
          </div>
          <button onClick={() => onNav('home')} className="btn btn-lg" style={{ background: 'var(--c-bg)', borderColor: 'var(--c-bg)', color: 'var(--c-text)' }}>SHOP BY VEHICLE →</button>
        </div>
      </section>
    </main>
  );
}

window.AboutPage = AboutPage;
