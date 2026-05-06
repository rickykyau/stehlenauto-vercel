// ============================================================
// Stehlen Auto — Category Landing Page (sub-type drill-down)
// Mirrors the Tyger pattern: category landing → sub-type → products.
// ============================================================
const { I, Stars, TrustRow } = window.STEHLEN_UI;

function CategoryPage({ vehicle, onYMMOpen, onNav, density, mobile, categorySlug = 'roof-racks' }) {
  const { CATEGORY_SUBTYPES, PRODUCTS, CATEGORIES, POPULAR_VEHICLES } = window.STEHLEN_DATA;
  const category = CATEGORY_SUBTYPES[categorySlug] || CATEGORY_SUBTYPES['roof-racks'];
  const cat = CATEGORIES.find(c => c.slug === categorySlug) || CATEGORIES[0];
  const featuredProducts = PRODUCTS.slice(0, 4);

  return (
    <main>
      {/* Breadcrumb */}
      <div style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
        <div className="container" style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); onNav('home'); }} className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', letterSpacing: '0.08em' }}>HOME</a>
          <span className="mono" style={{ fontSize: 11, color: 'var(--c-muted-2)' }}>/</span>
          <a href="#" className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', letterSpacing: '0.08em' }}>SHOP</a>
          <span className="mono" style={{ fontSize: 11, color: 'var(--c-muted-2)' }}>/</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--c-text)', letterSpacing: '0.08em', fontWeight: 600 }}>{category.headline}</span>
        </div>
      </div>

      {/* HERO — Category headline + intro + image */}
      <section style={{ background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{
          padding: mobile ? '32px 0' : '64px 0',
          display: 'grid',
          gridTemplateColumns: mobile ? '1fr' : '1.2fr 1fr',
          gap: mobile ? 24 : 48,
          alignItems: 'center',
        }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--c-accent)', marginBottom: 12 }}>CATEGORY · {cat.count} PARTS</div>
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 44 : 72, lineHeight: 0.95, letterSpacing: '-0.02em', textTransform: 'uppercase', fontWeight: 800 }}>
              {category.headline}
            </h1>
            <p style={{ fontSize: mobile ? 14 : 17, color: 'var(--c-muted)', maxWidth: 560, marginTop: 20, lineHeight: 1.55 }}>
              {category.intro}
            </p>
            <div style={{ display: 'flex', gap: 24, marginTop: 24, color: 'var(--c-muted)', fontSize: 12, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><I.check size={12} stroke="var(--c-success)"/> No drilling required</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><I.check size={12} stroke="var(--c-success)"/> Lifetime warranty</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><I.check size={12} stroke="var(--c-success)"/> Fitment guaranteed</span>
            </div>
          </div>
          {!mobile && category.heroImage && (
            <div style={{ position: 'relative', height: 360, background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--c-border)' }}>
              <img src={category.heroImage} alt="" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
              <div className="mono" style={{ position: 'absolute', top: 16, left: 16, fontSize: 10, color: 'var(--c-muted-2)', letterSpacing: '0.16em' }}>FEATURED · {category.subtypes[0].code}</div>
            </div>
          )}
        </div>
      </section>

      {/* FITMENT NARROWING BAND */}
      {!vehicle ? (
        <section style={{ background: 'var(--c-accent)', color: '#0a0a0a', borderBottom: '1px solid var(--c-border)' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: mobile ? '20px 0' : '24px 0', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: '0 0 auto' }}>
              <I.shield size={22} stroke="#0a0a0a" />
              <div>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', fontWeight: 700, opacity: 0.7 }}>FITMENT GUARANTEED</div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 18 : 22, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.1 }}>Find {category.headline.toLowerCase()} for your ride</div>
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
      ) : (
        <section style={{ background: '#0a0a0a', color: '#fff', borderBottom: '1px solid var(--c-border)' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <I.check size={18} stroke="var(--c-success)" />
              <div className="mono" style={{ fontSize: 12, letterSpacing: '0.12em' }}>
                <span style={{ color: 'var(--c-muted)' }}>SHOWING {category.headline} FOR </span>
                <span style={{ fontWeight: 700 }}>{vehicle.year} {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onYMMOpen} className="btn btn-sm" style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>CHANGE VEHICLE</button>
              <button onClick={() => onNav('collection')} className="btn btn-sm btn-primary">JUMP TO RESULTS →</button>
            </div>
          </div>
        </section>
      )}

      {/* SUB-TYPE CARDS — the educational drill-down */}
      <section className="container" style={{ padding: mobile ? '40px 0' : '64px 0' }}>
        <div style={{ marginBottom: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>STEP 1 · CHOOSE A STYLE</div>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 28 : 36, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>WHICH {category.headline.replace(/S$/, '')} IS RIGHT FOR YOU?</h2>
          <p style={{ color: 'var(--c-muted)', fontSize: 14, maxWidth: 720, marginTop: 12, lineHeight: 1.55 }}>
            Stehlen offers {category.subtypes.length} distinct sub-types in this category — each engineered for a specific use case. Pick the one that matches your build, then we'll show you compatible parts for your vehicle.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : `repeat(${Math.min(category.subtypes.length, 4)}, 1fr)`, gap: 16 }}>
          {category.subtypes.map((s, i) => (
            <a key={s.code} href="#" onClick={(e) => { e.preventDefault(); onNav('collection', { categorySlug, subtypeCode: s.code }); }}
              style={{
                background: 'var(--c-surface)',
                border: '1px solid var(--c-border)',
                borderRadius: 'var(--r-md)',
                padding: 0,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                transition: 'transform 160ms ease, border-color 160ms ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--c-accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {/* Visual */}
              <div className="product-img-bg" style={{ aspectRatio: '4 / 3', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.image ? (
                  <img src={s.image} alt={s.name} style={{ maxWidth: '70%', maxHeight: '70%', objectFit: 'contain' }} />
                ) : (
                  <div className="mono" style={{ color: 'var(--c-muted-2)', fontSize: 11, letterSpacing: '0.18em' }}>[ {s.code} VISUAL ]</div>
                )}
                <div className="mono" style={{ position: 'absolute', top: 12, left: 12, fontSize: 10, color: 'var(--c-text)', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: 4, letterSpacing: '0.12em', fontWeight: 700 }}>{s.code}</div>
              </div>
              {/* Content */}
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                <div className="mono" style={{ fontSize: 10, color: 'var(--c-accent)', letterSpacing: '0.14em' }}>{s.tag.toUpperCase()}</div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{s.name}</div>
                <p style={{ fontSize: 13, color: 'var(--c-muted)', lineHeight: 1.5, flex: 1 }}>{s.summary}</p>
                <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: 12, marginTop: 4 }}>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted-2)', letterSpacing: '0.1em', marginBottom: 4 }}>BEST FOR</div>
                  <div style={{ fontSize: 12, color: 'var(--c-text)' }}>{s.bestFor}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text)' }}>{s.price}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--c-accent)', letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    SHOP {s.code} <I.arrowR size={12} stroke="var(--c-accent)" />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* COMPARISON BAND — what makes Stehlen different */}
      <section style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile ? '40px 0' : '56px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>WHY STEHLEN</div>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 24 : 32, textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 32 }}>BUILT FOR THE LONG HAUL.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { icon: 'shield', label: 'NO DRILLING', body: 'Every Stehlen part bolts to factory mounts or door-frame clamps. Reversible install means your truck stays warranty-clean.' },
              { icon: 'truck', label: 'COLD-ROLLED STEEL', body: '11–14 gauge depending on application. E-coated then powder-coated for desert-to-snowbelt durability.' },
              { icon: 'check', label: 'FITMENT GUARANTEED', body: 'Doesn\'t fit? We refund and pay return shipping. Ten years and 300,000+ customers tested.' },
            ].map((b) => {
              const Icon = I[b.icon] || I.check;
              return (
                <div key={b.label} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 20, background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)' }}>
                  <Icon size={22} stroke="var(--c-accent)" />
                  <div className="mono" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em' }}>{b.label}</div>
                  <p style={{ fontSize: 13, color: 'var(--c-muted)', lineHeight: 1.55 }}>{b.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS WITHIN CATEGORY */}
      <section className="container" style={{ padding: mobile ? '40px 0' : '56px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>STEP 2 · OR JUMP STRAIGHT TO PRODUCTS</div>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 24 : 32, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>BEST SELLERS IN {category.headline}</h2>
          </div>
          <a href="#" onClick={(e) => { e.preventDefault(); onNav('collection'); }} className="mono" style={{ fontSize: 12, color: 'var(--c-muted)', letterSpacing: '0.08em' }}>VIEW ALL {cat.count} →</a>
        </div>
        <div data-density={density} style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16 }}>
          {featuredProducts.map(p => (
            <window.ProductCard key={p.sku} product={p} density={density} onOpen={() => onNav('pdp')} vehicle={vehicle} />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile ? '40px 0' : '64px 0', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1.4fr', gap: mobile ? 24 : 64 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>BUYING GUIDE</div>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 28 : 40, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 0.95 }}>QUESTIONS BEFORE YOU BUY?</h2>
            <p style={{ color: 'var(--c-muted)', fontSize: 14, marginTop: 16, lineHeight: 1.55 }}>
              Real answers from our install team. Need more? Call <a href="tel:18002274683" style={{ color: 'var(--c-accent)' }}>1-800-227-4683</a> Mon–Fri 8am–6pm PT.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {category.faqs.map((f, i) => (
              <details key={i} style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: '16px 20px' }}>
                <summary style={{ cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontWeight: 500 }}>
                  <span>{f.q}</span>
                  <I.arrowR size={14} stroke="var(--c-muted)" />
                </summary>
                <p style={{ color: 'var(--c-muted)', fontSize: 14, marginTop: 12, lineHeight: 1.55 }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* RELATED CATEGORIES */}
      <section className="container" style={{ padding: '48px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>RELATED CATEGORIES</div>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
          {CATEGORIES.filter(c => c.slug !== categorySlug).slice(0, 4).map((c) => (
            <a key={c.slug} href="#" onClick={(e) => { e.preventDefault(); onNav('home'); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)' }}>
              <div className="mono" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.name}</div>
              <I.arrowR size={14} stroke="var(--c-muted)" />
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

window.CategoryPage = CategoryPage;
