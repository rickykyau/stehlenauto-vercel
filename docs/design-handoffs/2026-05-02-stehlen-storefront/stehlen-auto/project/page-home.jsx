// ============================================================
// Stehlen Auto — Home Page
// ============================================================
const { I, Stars, TrustRow } = window.STEHLEN_UI;

function HomePage({ vehicle, onYMMOpen, onNav, density, mobile }) {
  const { CATEGORIES, POPULAR_VEHICLES, PRODUCTS, RECENTLY_VIEWED } = window.STEHLEN_DATA;

  return (
    <main>
      {/* HERO — Full-bleed lifestyle image with overlaid YMM */}
      <section style={{
        position: 'relative',
        background: 'var(--c-bg)',
        borderBottom: '1px solid var(--c-border)',
        overflow: 'hidden',
        minHeight: mobile ? 520 : 640,
      }}>
        {/* Background image */}
        <img
          src="assets/hero-stehlen.jpg"
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: mobile ? 'center center' : 'right center',
          }}
        />
        {/* Gradient mask — covers left 60% only, fades to transparent */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: mobile
            ? 'linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.92) 60%, rgba(10,10,10,0.97) 100%)'
            : 'linear-gradient(90deg, rgba(10,10,10,1) 0%, rgba(10,10,10,0.95) 30%, rgba(10,10,10,0.6) 50%, rgba(10,10,10,0.15) 60%, rgba(10,10,10,0) 75%)',
        }} />
        {/* Subtle engineering grid overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(245,168,35,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,168,35,0.04) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          mixBlendMode: 'screen',
        }} />

        <div className="container" style={{
          position: 'relative', zIndex: 2,
          padding: mobile ? '32px 0 36px' : '72px 0 80px',
          minHeight: mobile ? 520 : 640,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: 'flex-start',
        }}>
          <div style={{ maxWidth: mobile ? '100%' : 600, width: mobile ? '100%' : '50%' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ width: 32, height: 2, background: 'var(--c-accent)' }} />
              <span className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>STEHLEN AUTO · SINCE 2015</span>
            </div>
            <h1 style={{
              fontFamily: 'var(--f-display)',
              fontSize: mobile ? 40 : 72,
              lineHeight: 0.92,
              letterSpacing: '-0.025em',
              textTransform: 'uppercase',
              fontWeight: 800,
              textShadow: '0 4px 32px rgba(0,0,0,0.6)',
            }}>
              BUILT TOUGH.<br/>
              <span style={{ color: 'var(--c-accent)' }}>BOLT ON.</span><br/>
              DRIVE OFF.
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: mobile ? 14 : 16, maxWidth: 520, marginTop: 18, lineHeight: 1.55, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
              Heavy-duty truck, SUV, and Jeep accessories engineered from cold-rolled steel. No drilling required. Fitment guaranteed for your vehicle.
            </p>

            {/* Inline YMM */}
            <div style={{
              marginTop: mobile ? 24 : 32,
              background: 'rgba(20,20,20,0.85)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 'var(--r-lg)',
              padding: mobile ? 14 : 16,
              maxWidth: 580,
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: -1, left: -1, right: -1, height: 2, background: 'linear-gradient(90deg, transparent 0%, var(--c-accent) 50%, transparent 100%)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div className="eyebrow" style={{ fontSize: 11, marginBottom: 0, color: 'rgba(255,255,255,0.6)' }}>SHOP BY VEHICLE</div>
                <span className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>FITMENT GUARANTEED</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : '1fr 1fr 1fr auto', gap: 8 }}>
                <button onClick={onYMMOpen} className="select" style={{ height: 48, textAlign: 'left', cursor: 'pointer', color: vehicle ? 'var(--c-text)' : 'var(--c-muted-2)', display: 'flex', alignItems: 'center', padding: '0 14px' }}>
                  {vehicle ? vehicle.year : 'YEAR'}
                </button>
                <button onClick={onYMMOpen} className="select" style={{ height: 48, textAlign: 'left', cursor: 'pointer', color: vehicle ? 'var(--c-text)' : 'var(--c-muted-2)', display: 'flex', alignItems: 'center', padding: '0 14px' }}>
                  {vehicle ? vehicle.make.toUpperCase() : 'MAKE'}
                </button>
                <button onClick={onYMMOpen} className="select" style={{ height: 48, textAlign: 'left', cursor: 'pointer', color: vehicle ? 'var(--c-text)' : 'var(--c-muted-2)', display: 'flex', alignItems: 'center', padding: '0 14px', gridColumn: mobile ? '1 / -1' : 'auto' }}>
                  {vehicle ? vehicle.model.toUpperCase() : 'MODEL'}
                </button>
                <button onClick={() => vehicle ? onNav('collection') : onYMMOpen()} className="btn btn-primary" style={{ height: 48, minWidth: mobile ? 'auto' : 140, gridColumn: mobile ? '1 / -1' : 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {vehicle ? 'SHOP PARTS' : 'GET STARTED'} <I.arrowR size={14} />
                </button>
              </div>
              {!vehicle && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                  <I.shield size={13} /> Or <a href="#" onClick={(e) => { e.preventDefault(); onNav('collection'); }} style={{ color: 'var(--c-accent)' }}>browse universal-fit accessories →</a>
                </div>
              )}
              {vehicle && (
                <div style={{ marginTop: 12, padding: 10, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <I.check size={14} stroke="var(--c-success)" />
                  <span className="mono" style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--c-success)' }}>
                    GARAGE LOADED · {[POPULAR_VEHICLES.find(v => v.make === vehicle.make && v.model === vehicle.model)?.count || 287, ' parts available'].join('')}
                  </span>
                </div>
              )}
            </div>

            {/* Trust micro-row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: mobile ? 14 : 24, marginTop: 20, color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><I.check size={12} stroke="var(--c-success)"/> Free shipping $99+</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><I.check size={12} stroke="var(--c-success)"/> 30-day returns</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><I.check size={12} stroke="var(--c-success)"/> Lifetime warranty</span>
            </div>

            {/* Secondary CTAs */}
            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              <button onClick={() => onNav('collection')} className="btn" style={{ height: 44, background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.2)', color: '#fff', backdropFilter: 'blur(8px)' }}>
                SHOP ALL PARTS <I.arrowR size={12} />
              </button>
              <button onClick={() => onNav('collection')} className="btn" style={{ height: 44, background: 'transparent', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                BEST SELLERS
              </button>
            </div>
          </div>

          {/* Caption removed per feedback */}
        </div>
      </section>

      {/* High-contrast YMM band — primary conversion mechanic, Tyger-style */}
      {!vehicle && (
        <section style={{ background: 'var(--c-accent)', color: '#0a0a0a', borderBottom: '1px solid var(--c-border)' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: mobile ? '20px 0' : '24px 0', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: '0 0 auto' }}>
              <I.shield size={22} stroke="#0a0a0a" />
              <div>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', fontWeight: 700, opacity: 0.7 }}>FITMENT GUARANTEED</div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 18 : 22, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.1 }}>Find parts for your ride</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : '1fr 1fr 1fr auto', gap: 8, flex: 1, minWidth: mobile ? '100%' : 480 }}>
              <button onClick={onYMMOpen} style={{ height: 44, background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontFamily: 'var(--f-mono)', fontSize: 12, letterSpacing: '0.1em', textAlign: 'left', padding: '0 14px', cursor: 'pointer', textTransform: 'uppercase' }}>YEAR ▾</button>
              <button onClick={onYMMOpen} style={{ height: 44, background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontFamily: 'var(--f-mono)', fontSize: 12, letterSpacing: '0.1em', textAlign: 'left', padding: '0 14px', cursor: 'pointer', textTransform: 'uppercase' }}>MAKE ▾</button>
              <button onClick={onYMMOpen} style={{ height: 44, background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontFamily: 'var(--f-mono)', fontSize: 12, letterSpacing: '0.1em', textAlign: 'left', padding: '0 14px', cursor: 'pointer', textTransform: 'uppercase', gridColumn: mobile ? '1 / -1' : 'auto' }}>MODEL ▾</button>
              <button onClick={onYMMOpen} style={{ height: 44, background: '#0a0a0a', color: 'var(--c-accent)', border: 'none', borderRadius: 'var(--r-sm)', fontFamily: 'var(--f-display)', fontSize: 13, fontWeight: 800, letterSpacing: '0.04em', cursor: 'pointer', padding: '0 22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, gridColumn: mobile ? '1 / -1' : 'auto' }}>SEARCH <I.arrowR size={14} stroke="var(--c-accent)" /></button>
            </div>
          </div>
        </section>
      )}
      {vehicle && (
        <section style={{ background: '#0a0a0a', color: '#fff', borderBottom: '1px solid var(--c-border)' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <I.check size={18} stroke="var(--c-success)" />
              <div className="mono" style={{ fontSize: 12, letterSpacing: '0.12em' }}>
                <span style={{ color: 'var(--c-muted)' }}>SHOPPING FOR </span>
                <span style={{ fontWeight: 700 }}>{vehicle.year} {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onYMMOpen} className="btn btn-sm" style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>CHANGE VEHICLE</button>
              <button onClick={() => onNav('collection')} className="btn btn-sm btn-primary">SHOP COMPATIBLE PARTS →</button>
            </div>
          </div>
        </section>
      )}

      {/* Best sellers — promoted up to lead position */}
      <section className="container" style={{ padding: '64px 0 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>01 · TOP RATED</div>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 32, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>BEST SELLERS THIS MONTH</h2>
          </div>
          <a href="#" onClick={(e) => { e.preventDefault(); onNav('collection'); }} className="mono" style={{ fontSize: 12, color: 'var(--c-muted)', letterSpacing: '0.08em' }}>SHOP ALL →</a>
        </div>
        <div data-density={density} style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16 }}>
          {PRODUCTS.slice(0, 4).map(p => (
            <window.ProductCard key={p.sku} product={p} density={density} onOpen={() => onNav('pdp')} vehicle={vehicle} />
          ))}
        </div>
      </section>

      {/* Reactivation banner */}
      <section style={{ background: 'var(--c-surface-2)', borderTop: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 4, height: 36, background: 'var(--c-accent)' }} />
            <div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--c-accent)', letterSpacing: '0.14em' }}>WELCOME BACK</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Bought from us on eBay or Amazon? You'll find the same parts here — at lower prices.</div>
            </div>
          </div>
          <button className="btn btn-sm">CLAIM 10% RETURNING-CUSTOMER OFFER →</button>
        </div>
      </section>

      {/* Categories grid */}
      <section className="container" style={{ padding: '64px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>02 · BROWSE</div>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 32, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>SHOP BY CATEGORY</h2>
          </div>
          <a href="#" className="mono" style={{ fontSize: 12, color: 'var(--c-muted)', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
            VIEW ALL <I.arrowR size={12} />
          </a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 1, background: 'var(--c-border)', border: '1px solid var(--c-border)' }}>
          {CATEGORIES.map((cat, i) => (
            <a key={cat.slug} href="#" onClick={(e) => { e.preventDefault(); onNav('category', { categorySlug: cat.slug }); }}
              style={{
                background: 'var(--c-surface)',
                padding: 24, display: 'flex', flexDirection: 'column', gap: 12,
                position: 'relative', overflow: 'hidden',
                transition: 'background 120ms ease',
                aspectRatio: mobile ? '1' : '1.05',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--c-surface-2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--c-surface)'; }}
            >
              <div className="product-img-bg" style={{ flex: 1, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100 }}>
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                ) : (
                  <span className="mono" style={{ color: '#999', fontSize: 11, letterSpacing: '0.12em' }}>{cat.name.toUpperCase()}</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div className="mono" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{cat.name}</div>
                <I.arrowR size={14} stroke="var(--c-muted)" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Trust row */}
      <TrustRow />

      {/* Popular vehicles */}
      <section className="container" style={{ padding: '64px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>03 · BROWSE</div>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 32, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>SHOP BY POPULAR VEHICLE</h2>
          </div>
          <a href="#" className="mono" style={{ fontSize: 12, color: 'var(--c-muted)', letterSpacing: '0.08em' }}>ALL MAKES →</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 8 }}>
          {POPULAR_VEHICLES.map((v) => (
            <a key={v.make+v.model} href="#" onClick={(e) => { e.preventDefault(); onNav('collection'); }}
              style={{
                display: 'flex', flexDirection: 'column', gap: 6,
                padding: 16,
                background: 'var(--c-surface)', border: '1px solid var(--c-border)',
                borderRadius: 'var(--r-md)',
              }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.1em' }}>{v.make.toUpperCase()}</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{v.model}</div>
              <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{v.years}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--c-accent)', letterSpacing: '0.08em' }}>{v.count} PARTS</span>
                <I.arrowR size={12} />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: '64px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="eyebrow" style={{ marginBottom: 12, color: 'var(--c-accent)' }}>★ 4.7 / 5 · BASED ON 12,847 VERIFIED REVIEWS</div>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 32, textTransform: 'uppercase' }}>BUILT BY DRIVERS,<br/>FOR DRIVERS.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { name: 'Mike R.', vehicle: '2019 F-150', body: 'Door-frame mount lined up perfectly. Drilling-free is the truth. Fit guaranteed actually means something here.' },
              { name: 'Dale W.', vehicle: '2021 Silverado', body: 'Bought from Stehlen on eBay 4 years ago. Same quality, way better prices direct from the site. Switching for good.' },
              { name: 'Carlos T.', vehicle: '2017 Wrangler', body: 'Heavy-duty is not marketing here — these parts are tanks. Already on my third order.' },
            ].map((r, i) => (
              <div key={i} style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)', padding: 24, borderRadius: 'var(--r-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Stars rating={5} size={14} />
                  <span className="mono" style={{ fontSize: 10, color: 'var(--c-success)', letterSpacing: '0.08em' }}>✓ VERIFIED</span>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>"{r.body}"</p>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.08em' }}>{r.name.toUpperCase()} <span style={{ color: 'var(--c-muted)' }}>· {r.vehicle.toUpperCase()}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recently viewed */}
      <section className="container" style={{ padding: '64px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>RECENTLY VIEWED</div>
        <div data-density={density} style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16 }}>
          {RECENTLY_VIEWED.map(p => (
            <window.ProductCard key={p.sku} product={p} density={density} onOpen={() => onNav('pdp')} vehicle={vehicle} />
          ))}
        </div>
      </section>
    </main>
  );
}

window.HomePage = HomePage;
