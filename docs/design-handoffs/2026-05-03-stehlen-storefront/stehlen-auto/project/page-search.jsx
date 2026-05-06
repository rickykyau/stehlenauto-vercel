// ============================================================
// Stehlen Auto — Search Results Page
// ============================================================
const { I } = window.STEHLEN_UI;

function SearchResultsPage({ onNav, onYMMOpen, vehicle, mobile, density }) {
  const [q, setQ] = useState('roof rack');
  const [sort, setSort] = useState('relevance');
  const [view, setView] = useState('grid');
  const [fitOnly, setFitOnly] = useState(true);

  const products = window.STEHLEN_DATA.PRODUCTS;
  const filtered = fitOnly && vehicle ? products.filter(p => p.fits) : products;

  const empty = q.trim().length === 0;

  return (
    <main>
      {/* SEARCH HEADER */}
      <div style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
        <div className="container" style={{ padding: mobile ? '24px 0' : '36px 0' }}>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-muted)', display: 'flex' }}>
              <I.search size={18} />
            </span>
            <input value={q} onChange={(e) => setQ(e.target.value)} className="input" autoFocus
              placeholder="Search by Year Make Model, product type, or part number…"
              style={{ height: 56, paddingLeft: 50, paddingRight: 100, fontSize: 16, fontFamily: 'var(--f-body)', textTransform: 'none', letterSpacing: 0 }} />
            {q && <button onClick={() => setQ('')} className="btn btn-sm" style={{ position: 'absolute', right: 8, top: 8, height: 40 }}>CLEAR</button>}
          </div>
          {!empty && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
              <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 26 : 36, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
                Results for "<span style={{ color: 'var(--c-accent)' }}>{q}</span>"
              </h1>
              <span className="mono" style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--c-muted)' }}>
                SHOWING {filtered.length} MATCHES{vehicle && fitOnly ? ` · FITTING ${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* EMPTY STATE / DID YOU MEAN */}
      {empty ? (
        <div className="container" style={{ padding: mobile ? '32px 0' : '56px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 32 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>POPULAR SEARCHES</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['F-150 roof rack', 'tonneau cover', 'modular bumper', 'LED bed lights', 'mesh grille insert', 'fender flares', 'running boards', 'tow hitch class IV'].map(t => (
                  <button key={t} onClick={() => setQ(t)} className="chip" style={{ height: 32, padding: '0 12px', fontSize: 11, cursor: 'pointer' }}>{t.toUpperCase()}</button>
                ))}
              </div>

              <div className="eyebrow" style={{ marginTop: 36, marginBottom: 12 }}>SHOP BY VEHICLE</div>
              <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 8 }}>
                {window.STEHLEN_DATA.POPULAR_VEHICLES.slice(0, 6).map(v => (
                  <button key={v.make + v.model} onClick={onYMMOpen} className="btn btn-sm" style={{ justifyContent: 'flex-start', height: 44, padding: '0 14px' }}>
                    <I.truck size={12} stroke="var(--c-accent)" />
                    <span style={{ fontSize: 11, letterSpacing: '0.06em' }}>{v.make.toUpperCase()} {v.model.toUpperCase()}</span>
                  </button>
                ))}
              </div>

              <div className="eyebrow" style={{ marginTop: 36, marginBottom: 12 }}>RECENT SEARCHES</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {['F-150 SuperCrew bed rack', 'tonneau lock & roll-up', 'grille light bar ready'].map((s, i) => (
                  <button key={i} onClick={() => setQ(s)} style={{ background: 'transparent', border: 0, borderBottom: '1px solid var(--c-border)', padding: '12px 0', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--c-text)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                      <I.search size={12} stroke="var(--c-muted-2)" />
                      <span style={{ fontSize: 13 }}>{s}</span>
                    </span>
                    <I.arrowR size={12} stroke="var(--c-muted)" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>TRENDING NOW</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {products.slice(0, 4).map(p => (
                  <window.ProductCard key={p.sku} product={p} density="compact" onOpen={() => onNav('pdp')} vehicle={vehicle} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container" style={{ padding: mobile ? '20px 0' : '32px 0' }}>
          {/* Did you mean */}
          <div style={{ background: 'rgba(245,168,35,0.06)', border: '1px solid rgba(245,168,35,0.3)', borderRadius: 'var(--r-md)', padding: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--c-accent)', letterSpacing: '0.12em' }}>DID YOU MEAN</span>
            <button onClick={() => setQ('roof racks')} style={{ background: 'transparent', border: 0, color: 'var(--c-text)', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}>roof racks</button>
            <span style={{ color: 'var(--c-muted-2)' }}>·</span>
            <button onClick={() => setQ('rack mount')} style={{ background: 'transparent', border: 0, color: 'var(--c-text)', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}>rack mount</button>
            <span style={{ color: 'var(--c-muted-2)' }}>·</span>
            <button onClick={() => setQ('cargo basket')} style={{ background: 'transparent', border: 0, color: 'var(--c-text)', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}>cargo basket</button>
          </div>

          {/* Filter bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={vehicle ? () => setFitOnly(f => !f) : onYMMOpen} className="chip chip-removable" style={{
                height: 32, padding: '0 12px', cursor: 'pointer',
                background: fitOnly && vehicle ? 'rgba(34,197,94,0.1)' : 'var(--c-surface)',
                borderColor: fitOnly && vehicle ? 'rgba(34,197,94,0.4)' : 'var(--c-border)',
                color: fitOnly && vehicle ? 'var(--c-success)' : 'var(--c-text)',
              }}>
                <I.truck size={11} />
                {vehicle ? `${fitOnly ? 'FITS ' : 'ALL · IGNORE '}${vehicle.year} ${vehicle.make.toUpperCase()}` : 'SET VEHICLE TO FILTER'}
                {vehicle && <I.close size={11} stroke="currentColor" />}
              </button>
              <button className="chip" style={{ height: 32, padding: '0 12px', cursor: 'pointer' }}>CATEGORY: ANY ▾</button>
              <button className="chip" style={{ height: 32, padding: '0 12px', cursor: 'pointer' }}>BRAND: STEHLEN ▾</button>
              <button className="chip" style={{ height: 32, padding: '0 12px', cursor: 'pointer' }}>PRICE ▾</button>
              <button className="chip" style={{ height: 32, padding: '0 12px', cursor: 'pointer' }}>RATING 4+ ★</button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="select" style={{ width: 200, height: 36 }}>
                <option value="relevance">RELEVANCE</option>
                <option value="bestseller">BEST SELLER</option>
                <option value="rating">HIGHEST RATED</option>
                <option value="price-asc">PRICE LOW → HIGH</option>
                <option value="price-desc">PRICE HIGH → LOW</option>
                <option value="newest">NEWEST</option>
              </select>
              <div style={{ display: 'flex', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)' }}>
                <button onClick={() => setView('grid')} style={{ width: 36, height: 36, background: view === 'grid' ? 'var(--c-surface-2)' : 'transparent', border: 0, color: 'var(--c-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.grid size={14} /></button>
                <button onClick={() => setView('list')} style={{ width: 36, height: 36, background: view === 'list' ? 'var(--c-surface-2)' : 'transparent', border: 0, color: 'var(--c-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.list size={14} /></button>
              </div>
            </div>
          </div>

          {/* Quick category chip-row of matching categories */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.12em', alignSelf: 'center' }}>MATCHES IN:</span>
            {[
              ['Roof Racks', 'roof-racks'],
              ['Bed Lighting', 'bed-lights'],
              ['Tonneau Covers', 'tonneau-covers'],
              ['Bed Mats', 'bed-mats'],
            ].map(([n, slug]) => (
              <button key={slug} onClick={() => onNav('category', { categorySlug: slug })} className="chip" style={{ height: 26, cursor: 'pointer' }}>{n.toUpperCase()}</button>
            ))}
          </div>

          {/* Results grid */}
          {view === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16 }}>
              {filtered.map(p => (
                <window.ProductCard key={p.sku} product={p} density={density} onOpen={() => onNav('pdp')} vehicle={vehicle} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--c-border)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
              {filtered.map(p => (
                <a key={p.sku} href="#" onClick={(e) => { e.preventDefault(); onNav('pdp'); }} style={{
                  display: 'grid', gridTemplateColumns: mobile ? '80px 1fr auto' : '120px 1fr 200px auto auto',
                  gap: 16, padding: 14, alignItems: 'center',
                  background: 'var(--c-surface)',
                }}>
                  <div className="product-img-bg" style={{ width: mobile ? 80 : 120, height: mobile ? 80 : 120, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={p.image} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--c-muted-2)', letterSpacing: '0.12em', marginBottom: 4 }}>{p.sku}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{p.fitTitle}</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {p.chips.slice(0, 3).map(c => <span key={c} className="chip" style={{ height: 18, fontSize: 9 }}>{c}</span>)}
                    </div>
                  </div>
                  {!mobile && (
                    <div>
                      <window.STEHLEN_UI.Stars rating={p.rating} size={11} />
                      <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 4, letterSpacing: '0.06em' }}>{p.rating} · {p.reviews} REVIEWS</div>
                      {vehicle && (
                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: p.fits ? 'var(--c-success)' : 'var(--c-danger)' }}>
                          {p.fits ? <I.check size={11}/> : <I.close size={11}/>}
                          <span className="mono" style={{ letterSpacing: '0.08em' }}>{p.fits ? 'FITS' : 'DOES NOT FIT'}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {!mobile && (
                    <div style={{ textAlign: 'right' }}>
                      <div className="mono" style={{ fontSize: 18, fontWeight: 700 }}>${p.price.toFixed(0)}</div>
                      {p.compareAt && <div className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', textDecoration: 'line-through' }}>${p.compareAt.toFixed(0)}</div>}
                    </div>
                  )}
                  <button className="btn btn-sm">VIEW</button>
                </a>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 40 }}>
            <button className="btn btn-sm" disabled><I.chevLeft size={11} /> PREV</button>
            {[1,2,3,4].map(n => (
              <button key={n} className="btn btn-sm" style={{ width: 36, padding: 0, background: n === 1 ? 'var(--c-text)' : 'transparent', color: n === 1 ? 'var(--c-bg)' : 'var(--c-text)', borderColor: n === 1 ? 'var(--c-text)' : 'var(--c-border)' }}>{n}</button>
            ))}
            <span className="mono" style={{ color: 'var(--c-muted-2)', fontSize: 11 }}>…</span>
            <button className="btn btn-sm" style={{ width: 36, padding: 0 }}>9</button>
            <button className="btn btn-sm">NEXT <I.chevRight size={11} /></button>
          </div>
        </div>
      )}
    </main>
  );
}

window.SearchResultsPage = SearchResultsPage;
