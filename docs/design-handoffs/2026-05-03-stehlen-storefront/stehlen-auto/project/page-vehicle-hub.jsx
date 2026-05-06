// ============================================================
// Stehlen Auto — Vehicle Hub Page (e.g. /vehicles/ford-f150)
// ============================================================
const { I, Stars } = window.STEHLEN_UI;

function VehicleHubPage({ onNav, onYMMOpen, vehicle, mobile }) {
  const make = vehicle?.make || 'Ford';
  const model = vehicle?.model || 'F-150';
  const products = window.STEHLEN_DATA.PRODUCTS;
  const cats = window.STEHLEN_DATA.CATEGORIES.slice(0, 8);

  // Year range chips
  const years = ['2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013'];

  return (
    <main>
      {/* HERO */}
      <div style={{ position: 'relative', background: '#000', overflow: 'hidden' }}>
        <img src="assets/hero-stehlen.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,10,0.5) 0%, rgba(10,10,10,0.95) 100%)' }} />
        <div className="container" style={{ position: 'relative', padding: mobile ? '40px 0 32px' : '72px 0 56px' }}>
          <div className="eyebrow" style={{ marginBottom: 16, color: 'var(--c-accent)' }}>VEHICLE HUB</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 56 : 120, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.85, fontWeight: 800 }}>
            {make.toUpperCase()}<br/>
            <span style={{ color: 'var(--c-accent)' }}>{model.toUpperCase()}</span>
          </h1>
          <p style={{ marginTop: 24, maxWidth: 640, fontSize: mobile ? 16 : 18, color: 'var(--c-muted)', lineHeight: 1.6 }}>
            Bolt-on accessories engineered for every {make} {model} generation. No drilling. No guesswork. Pick a year and we'll handle the rest.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 32, flexWrap: 'wrap' }}>
            <button onClick={onYMMOpen} className="btn btn-primary btn-lg">
              <I.truck size={14} stroke="var(--c-bg)" />
              SET YOUR EXACT TRIM
            </button>
            <button onClick={() => onNav('home')} className="btn btn-lg">SHOP ALL CATEGORIES</button>
          </div>

          {/* Stat strip */}
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 0, marginTop: 48, borderTop: '1px solid var(--c-border)' }}>
            {[
              ['12 GENERATIONS', '2014 → 2025'],
              ['8 CATEGORIES', 'Bumper to bed'],
              ['BOLT-ON', 'No drilling'],
              ['LIFETIME', 'Warranty'],
            ].map(([k, v], i) => (
              <div key={i} style={{ padding: '20px 0', borderRight: !mobile && i < 3 ? '1px solid var(--c-border)' : 0, borderBottom: mobile && i < 2 ? '1px solid var(--c-border)' : 0, paddingLeft: i > 0 && !mobile ? 24 : 0 }}>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 600 }}>{k}</div>
                <div style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 4 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* YEAR PICKER STRIP */}
      <div style={{ background: 'var(--c-accent)', color: 'var(--c-bg)' }}>
        <div className="container" style={{ padding: '20px 0', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>Pick your year</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
            {years.map(y => (
              <button key={y} onClick={onYMMOpen} className="mono" style={{
                padding: '8px 14px',
                background: 'rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.2)',
                color: 'var(--c-bg)',
                fontSize: 12, fontWeight: 600, letterSpacing: '0.06em',
                cursor: 'pointer',
                borderRadius: 'var(--r-sm)',
              }}>{y}</button>
            ))}
          </div>
        </div>
      </div>

      {/* GENERATIONS */}
      <div style={{ background: 'var(--c-surface)' }}>
        <div className="container" style={{ padding: mobile ? '40px 0' : '64px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>GENERATIONS</div>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 32 : 44, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 32 }}>Know your truck.</h2>

          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { gen: '13TH GEN', years: '2021 — 2024', code: 'P702', body: 'Aluminum body, hybrid PowerBoost variant. PowerStop tailgate.', parts: 1840 },
              { gen: '12TH GEN', years: '2015 — 2020', code: 'P552', body: 'First aluminum body F-150. Major bumper redesign in 2018.', parts: 2120 },
              { gen: '11TH GEN', years: '2009 — 2014', code: 'P415', body: 'Last steel-bodied F-150. EcoBoost debut in 2011.', parts: 1290 },
            ].map((g, i) => (
              <div key={g.gen} style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden', position: 'relative' }}>
                {i === 0 && <span className="badge badge-best" style={{ position: 'absolute', top: 14, right: 14, zIndex: 2 }}>MOST POPULAR</span>}
                <div className="product-img-bg" style={{ aspectRatio: '4 / 3', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {/* truck silhouette */}
                  <svg viewBox="0 0 160 80" style={{ width: '70%', opacity: 0.5 }}>
                    <path d="M10,55 L40,55 L48,32 L100,32 L108,42 L150,42 L150,55 L140,55 A10,10 0 0,0 120,55 L60,55 A10,10 0 0,0 40,55 Z" fill="#888" />
                    <circle cx="50" cy="58" r="8" fill="#222" stroke="#888" strokeWidth="2" />
                    <circle cx="130" cy="58" r="8" fill="#222" stroke="#888" strokeWidth="2" />
                  </svg>
                </div>
                <div style={{ padding: 18 }}>
                  <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--c-accent)', fontWeight: 700 }}>{g.gen} · {g.code}</div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 700, marginTop: 4 }}>{g.years}</div>
                  <p style={{ fontSize: 13, color: 'var(--c-muted)', lineHeight: 1.6, marginTop: 8 }}>{g.body}</p>
                  <button onClick={onYMMOpen} className="btn btn-sm btn-block" style={{ marginTop: 14, justifyContent: 'space-between' }}>
                    SHOP THIS GEN <I.arrowR size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CATEGORY GRID */}
      <div className="container" style={{ padding: mobile ? '40px 0' : '64px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>SHOP BY CATEGORY</div>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 32 : 44, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Built for {make} {model}.</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
          {cats.map(c => (
            <button key={c.slug} onClick={() => onNav('category', { categorySlug: c.slug })} style={{
              padding: 0,
              background: 'var(--c-surface)',
              border: '1px solid var(--c-border)',
              borderRadius: 'var(--r-md)',
              color: 'var(--c-text)',
              cursor: 'pointer',
              textAlign: 'left',
              overflow: 'hidden',
            }}>
              <div className="product-img-bg" style={{ aspectRatio: '1.4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.truck size={36} stroke="var(--c-muted-2)" />
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 16, fontWeight: 700, textTransform: 'uppercase' }}>{c.title}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.08em', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>SHOP NOW</span>
                  <I.arrowR size={11} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* TOP PRODUCTS */}
      <div style={{ background: 'var(--c-surface)' }}>
        <div className="container" style={{ padding: mobile ? '40px 0' : '64px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>TOP PICKS FOR THE {model.toUpperCase()}</div>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 32 : 44, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 24 }}>What other {make.toLowerCase()} owners buy.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16 }}>
            {products.slice(0, 4).map(p => (
              <window.ProductCard key={p.sku} product={p} onOpen={() => onNav('pdp')} vehicle={vehicle} />
            ))}
          </div>
        </div>
      </div>

      {/* OWNER CALLOUT */}
      <div style={{ background: 'var(--c-bg)' }}>
        <div className="container" style={{ padding: mobile ? '40px 0' : '64px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>FROM ACTUAL OWNERS</div>
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 32 : 44, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 16 }}>1,800+ verified {model} reviews.</h2>
              <Stars rating={4.7} size={16} />
              <p style={{ fontSize: 14, color: 'var(--c-muted)', marginTop: 16, lineHeight: 1.7 }}>
                Real installs. Real photos. Real towing receipts. We don't filter the hard stuff out — read the 1-star reviews and you'll see why the rest are 5.
              </p>
              <button className="btn" style={{ marginTop: 20 }}>BROWSE {model.toUpperCase()} REVIEWS <I.arrowR size={12} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { n: 'Jake P.', y: '2022 F-150 SuperCrew', r: 5, t: 'Roof rack went on in 22 minutes. Carries my Yakima box AND my kayak.' },
                { n: 'Marcus T.', y: '2019 F-150 STX', r: 5, t: 'Bed lights are SURGICALLY bright. Loading at 4am no problem.' },
                { n: 'Lina K.', y: '2024 F-150 Lariat', r: 4, t: 'Tonneau took two of us — instructions could be clearer on the front clamp.' },
                { n: 'Devon S.', y: '2017 F-150 XL', r: 5, t: 'Modular bumper changes the whole truck. Fitment is honest-to-god perfect.' },
              ].map((r, i) => (
                <div key={i} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 16 }}>
                  <Stars rating={r.r} size={11} />
                  <p style={{ fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>"{r.t}"</p>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.08em', marginTop: 10 }}>{r.n.toUpperCase()} · {r.y.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

window.VehicleHubPage = VehicleHubPage;
