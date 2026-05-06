// ============================================================
// Stehlen Auto — Collection Page
// ============================================================
const { I, Stars } = window.STEHLEN_UI;

function CollectionPage({ vehicle, onYMMOpen, onNav, density, mobile, categorySlug, subtypeCode }) {
  const { PRODUCTS, CATEGORY_SUBTYPES } = window.STEHLEN_DATA;
  const category = categorySlug ? CATEGORY_SUBTYPES[categorySlug] : null;
  const subtype = category && subtypeCode ? category.subtypes.find(s => s.code === subtypeCode) : null;
  const [showFilters, setShowFilters] = useState(false);
  const [activeChips, setActiveChips] = useState(['BLACK', '6.5\' BED']);
  const [sort, setSort] = useState('Best Selling');
  const [view, setView] = useState('grid');
  const [page, setPage] = useState(1);

  const removeChip = (c) => setActiveChips(activeChips.filter(x => x !== c));

  const Sidebar = () => (
    <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 4 }}>
      {/* Vehicle filter card */}
      <div style={{ padding: 16, borderBottom: '1px solid var(--c-border)' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>FITMENT</div>
        {vehicle ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c-success)' }} />
              <span className="mono" style={{ fontSize: 12, letterSpacing: '0.06em' }}>{vehicle.year} {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()}</span>
            </div>
            <button onClick={onYMMOpen} className="btn btn-sm btn-block" style={{ marginTop: 12 }}>CHANGE VEHICLE</button>
          </>
        ) : (
          <button onClick={onYMMOpen} className="btn btn-primary btn-block">SELECT YOUR VEHICLE</button>
        )}
      </div>

      {[
        { title: 'BED LENGTH', items: [['5\' Bed',12],['5.5\' Bed',24],['6.5\' Bed',38],['8\' Bed',8]], type: 'check' },
        { title: 'CAB TYPE',   items: [['Crew Cab',54],['SuperCab',32],['Regular Cab',12]], type: 'check' },
        { title: 'COLOR',      items: [['Black',86],['Matte Black',24],['Aluminum',8]], type: 'check' },
        { title: 'MATERIAL',   items: [['Steel',72],['Aluminum',38],['ABS',6]], type: 'check' },
        { title: 'PRICE',      items: null, type: 'price' },
        { title: 'BRAND',      items: [['Stehlen Pro',54],['Stehlen Heavy-Duty',32],['Stehlen Universal',56]], type: 'check' },
      ].map((sec) => (
        <div key={sec.title} style={{ padding: 16, borderBottom: '1px solid var(--c-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', fontWeight: 600 }}>{sec.title}</span>
            <I.minus size={12} />
          </div>
          {sec.type === 'check' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sec.items.map(([label, count], i) => {
                const active = activeChips.includes(label.toUpperCase());
                return (
                  <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <span style={{
                      width: 16, height: 16, borderRadius: 2,
                      border: '1px solid ' + (active ? 'var(--c-accent)' : 'var(--c-border-2)'),
                      background: active ? 'var(--c-accent)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {active && <I.check size={11} stroke="var(--c-bg)" sw={3} />}
                    </span>
                    <span style={{ fontSize: 13, flex: 1 }}>{label}</span>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--c-muted)' }}>{count}</span>
                  </label>
                );
              })}
            </div>
          )}
          {sec.type === 'price' && (
            <div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" placeholder="$ Min" style={{ height: 36, fontSize: 12 }} />
                <input className="input" placeholder="$ Max" style={{ height: 36, fontSize: 12 }} />
              </div>
              <div style={{ marginTop: 12, height: 4, background: 'var(--c-surface-2)', borderRadius: 2, position: 'relative' }}>
                <div style={{ position: 'absolute', left: '15%', right: '40%', height: '100%', background: 'var(--c-accent)' }} />
                <div style={{ position: 'absolute', left: '15%', top: -4, width: 12, height: 12, borderRadius: '50%', background: 'var(--c-text)', transform: 'translateX(-50%)' }} />
                <div style={{ position: 'absolute', left: '60%', top: -4, width: 12, height: 12, borderRadius: '50%', background: 'var(--c-text)', transform: 'translateX(-50%)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--c-muted)' }}>$0</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--c-muted)' }}>$1,000+</span>
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={{ padding: 16 }}>
        <button className="btn btn-block btn-sm">CLEAR ALL FILTERS</button>
      </div>
    </div>
  );

  return (
    <main>
      {/* SUB-TYPE HERO — only when arrived from a sub-type card */}
      {subtype ? (
        <>
          <section style={{
            position: 'relative',
            background: '#0a0a0a',
            backgroundImage: subtype.image ? `linear-gradient(90deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.7) 35%, rgba(10,10,10,0.2) 65%, rgba(10,10,10,0) 100%), url(${subtype.image})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
            color: '#fff',
            borderBottom: '1px solid var(--c-border)',
            minHeight: mobile ? 260 : 380,
            display: 'flex', alignItems: 'flex-end',
          }}>
            <div className="container" style={{ padding: mobile ? '24px 0' : '40px 0', width: '100%' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 14 }}>
                <a href="#" onClick={(e) => { e.preventDefault(); onNav('home'); }} style={{ color: 'rgba(255,255,255,0.7)' }}>HOME</a>
                <I.chevRight size={10} />
                <a href="#" onClick={(e) => { e.preventDefault(); onNav('category', { categorySlug }); }} style={{ color: 'rgba(255,255,255,0.7)' }}>{category.headline}</a>
                <I.chevRight size={10} /> <span style={{ color: '#fff' }}>STEHLEN {subtype.code} ({subtype.name.toUpperCase()})</span>
              </div>
              <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 36 : 56, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 0.95, fontWeight: 800 }}>
                STEHLEN {subtype.code} <span style={{ color: 'var(--c-accent)' }}>({subtype.name.toUpperCase()})</span>
              </h1>
              <p style={{ fontSize: mobile ? 13 : 15, color: 'rgba(255,255,255,0.85)', marginTop: 12, maxWidth: 640, lineHeight: 1.55 }}>
                {subtype.summary}
              </p>
            </div>
          </section>

          {/* INLINE YMM BAND — Tyger-style "SHOP BY VEHICLE" */}
          <section style={{ background: 'var(--c-accent)', color: '#0a0a0a', borderBottom: '1px solid var(--c-border)' }}>
            <div className="container" style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'auto 1fr 1fr 1fr 1fr auto auto', gap: 8, padding: mobile ? '16px 0' : '20px 0', alignItems: 'center' }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', fontWeight: 700, paddingRight: 16, borderRight: mobile ? 'none' : '1px solid rgba(0,0,0,0.15)' }}>
                SHOP BY<br/>VEHICLE
              </div>
              {['Year','Make','Model','Submodel'].map((label) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="mono" style={{ fontSize: 10, letterSpacing: '0.08em', fontWeight: 600, opacity: 0.6 }}>{label}</span>
                  <button onClick={onYMMOpen} style={{
                    height: 36, background: '#fff', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 4,
                    padding: '0 10px', fontSize: 13, color: '#0a0a0a', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span>{vehicle && label === 'Year' ? vehicle.year : vehicle && label === 'Make' ? vehicle.make : vehicle && label === 'Model' ? vehicle.model : `Select ${label}`}</span>
                    <I.chevRight size={11} />
                  </button>
                </div>
              ))}
              <button onClick={onYMMOpen} className="btn btn-sm" style={{ background: '#0a0a0a', color: '#fff', borderColor: '#0a0a0a', height: 36, padding: '0 18px', fontWeight: 700 }}>GO</button>
              <button className="btn btn-sm" style={{ background: 'transparent', borderColor: 'rgba(0,0,0,0.3)', color: '#0a0a0a', height: 36, padding: '0 14px' }}>RESET</button>
            </div>
          </section>

          {/* Active filter chip */}
          {vehicle && (
            <div style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
              <div className="container" style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--c-muted)', letterSpacing: '0.08em' }}>VIEWING:</span>
                <span style={{ fontSize: 14, color: 'var(--c-text)', fontWeight: 500 }}>
                  {vehicle.year} <span style={{ color: 'var(--c-muted-2)', margin: '0 6px' }}>{'\u203A'}</span>
                  {vehicle.make} <span style={{ color: 'var(--c-muted-2)', margin: '0 6px' }}>{'\u203A'}</span>
                  {vehicle.model}
                </span>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Default Collection hero (no sub-type) */
        <section style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
          <div className="container" style={{ padding: mobile ? '20px 0 24px' : '32px 0' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: 'var(--c-muted)', marginBottom: 14 }}>
              <a href="#" onClick={(e) => { e.preventDefault(); onNav('home'); }}>Home</a>
              <I.chevRight size={10} /> <a href="#">Exterior</a>
              <I.chevRight size={10} /> <span style={{ color: 'var(--c-text)' }}>Roof Racks</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 32 : 44, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>ROOF RACKS</h1>
                <p style={{ color: 'var(--c-muted)', fontSize: 14, marginTop: 8, maxWidth: 640 }}>
                  Door-frame, low-profile, and modular overland racks. Drilling-free installation. Engineered for trucks, SUVs, and Jeeps.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="mono" style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--c-muted)' }}>142 PRODUCTS</span>
                {vehicle && <span className="chip chip-success"><I.check size={10}/> 38 FIT YOUR {vehicle.make.toUpperCase()}</span>}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Toolbar — sticky */}
      <div style={{
        position: 'sticky', top: mobile ? 96 : 152, zIndex: 20,
        background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)',
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {mobile && (
              <button onClick={() => setShowFilters(true)} className="btn btn-sm">
                <I.filter size={12}/> FILTERS · {activeChips.length}
              </button>
            )}
            <button className="chip chip-success" style={{ cursor: 'default' }}>
              <I.check size={10}/> {vehicle ? `FITS ${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}` : 'UNIVERSAL'}
            </button>
            {activeChips.map(c => (
              <button key={c} onClick={() => removeChip(c)} className="chip chip-removable" style={{ background: 'var(--c-surface)' }}>
                {c} <I.close size={10} />
              </button>
            ))}
            {activeChips.length > 0 && (
              <button onClick={() => setActiveChips([])} style={{ background: 'transparent', border: 0, color: 'var(--c-muted)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Clear all</button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="select" style={{ width: 200, height: 36 }}>
              {['Best Selling','Featured','Price: Low → High','Price: High → Low','Highest Rated','Newest'].map(o => <option key={o}>{o}</option>)}
            </select>
            {!mobile && (
              <div style={{ display: 'flex', border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)' }}>
                <button onClick={() => setView('grid')} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: view === 'grid' ? 'var(--c-surface-2)' : 'transparent', border: 0, color: view === 'grid' ? 'var(--c-text)' : 'var(--c-muted)', cursor: 'pointer' }}>
                  <I.grid size={14} />
                </button>
                <button onClick={() => setView('list')} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: view === 'list' ? 'var(--c-surface-2)' : 'transparent', border: 0, color: view === 'list' ? 'var(--c-text)' : 'var(--c-muted)', cursor: 'pointer' }}>
                  <I.list size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container" style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '264px 1fr', gap: 32, padding: '24px 0 64px' }}>
        {!mobile && <aside><Sidebar /></aside>}
        <div>
          <div data-density={density} style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 16 }}>
            {PRODUCTS.map(p => (
              <window.ProductCard key={p.sku} product={p} density={density} onOpen={() => onNav('pdp')} vehicle={vehicle} />
            ))}
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--c-border)', flexWrap: 'wrap', gap: 12 }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', letterSpacing: '0.08em' }}>SHOWING 1–12 OF 142</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-sm" disabled><I.chevLeft size={12} /></button>
              {[1,2,3,'...',12].map((n, i) => (
                <button key={i} className="btn btn-sm" style={n === page ? { background: 'var(--c-text)', color: 'var(--c-bg)', borderColor: 'var(--c-text)' } : {}} onClick={() => typeof n === 'number' && setPage(n)}>
                  {n}
                </button>
              ))}
              <button className="btn btn-sm"><I.chevRight size={12} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filters drawer */}
      {mobile && showFilters && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowFilters(false)}>
          <div onClick={(e) => e.stopPropagation()} className="anim-slide-up" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: 60, background: 'var(--c-bg)', borderRadius: '12px 12px 0 0', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--c-border)' }}>
              <span className="mono" style={{ fontSize: 13, letterSpacing: '0.1em', fontWeight: 600 }}>FILTERS · {activeChips.length}</span>
              <button onClick={() => setShowFilters(false)} style={{ background: 'transparent', border: 0, color: 'var(--c-text)', display: 'flex' }}><I.close size={20} /></button>
            </div>
            <div style={{ padding: 16 }}><Sidebar /></div>
            <div style={{ position: 'sticky', bottom: 0, padding: 16, background: 'var(--c-bg)', borderTop: '1px solid var(--c-border)', display: 'flex', gap: 8 }}>
              <button onClick={() => setActiveChips([])} className="btn" style={{ flex: 1 }}>CLEAR</button>
              <button onClick={() => setShowFilters(false)} className="btn btn-primary" style={{ flex: 1 }}>SHOW 142</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

window.CollectionPage = CollectionPage;
