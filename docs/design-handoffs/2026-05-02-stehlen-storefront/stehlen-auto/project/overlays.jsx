// ============================================================
// Stehlen Auto — YMM Selector + Cart Drawer + Search
// ============================================================
const { I, Modal } = window.STEHLEN_UI;

const YMM_DATA = {
  years: ['2026','2025','2024','2023','2022','2021','2020','2019','2018','2017','2016','2015','2014','2013','2012','2011','2010','2009'],
  makes: {
    'Ford': ['F-150','F-250 Super Duty','F-350 Super Duty','Ranger','Bronco','Expedition','Explorer','Maverick','Mustang'],
    'Chevrolet': ['Silverado 1500','Silverado 2500HD','Colorado','Tahoe','Suburban','Blazer','Equinox','Camaro'],
    'Ram': ['1500','2500','3500','ProMaster','Dakota'],
    'Toyota': ['Tacoma','Tundra','4Runner','Sequoia','RAV4','Highlander','Camry'],
    'Jeep': ['Wrangler','Gladiator','Grand Cherokee','Cherokee','Compass'],
    'GMC': ['Sierra 1500','Sierra 2500HD','Canyon','Yukon','Yukon XL'],
    'Nissan': ['Frontier','Titan','Pathfinder','Murano','Rogue'],
    'Dodge': ['Charger','Challenger','Durango','Journey'],
    'Honda': ['Ridgeline','Pilot','Passport','CR-V'],
    'Hyundai': ['Santa Fe','Tucson','Palisade'],
  },
};

// ---------- YMM Selector ----------
function YMMSelector({ open, onClose, onSelect, mobile = false, variant = 'inline' }) {
  const [step, setStep] = useState(0); // for stepped variant
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');

  useEffect(() => {
    if (open) { setStep(0); setYear(''); setMake(''); setModel(''); }
  }, [open]);

  const canGo = year && make && model;
  const handleGo = () => {
    if (!canGo) return;
    onSelect && onSelect({ year, make, model });
    onClose && onClose();
  };

  const stepped = variant === 'stepped';
  const showYear  = !stepped || step >= 0;
  const showMake  = !stepped || step >= 1;
  const showModel = !stepped || step >= 2;

  const Field = ({ label, value, options, onChange, disabled, autoAdvance }) => (
    <div>
      <div className="label-eyebrow">{label}</div>
      <select className="select" value={value} onChange={(e) => {
        onChange(e.target.value);
        if (autoAdvance && stepped && e.target.value) setStep(s => s + 1);
      }} disabled={disabled}>
        <option value="">Select {label}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} mobile={mobile} title="FIND PARTS FOR YOUR VEHICLE" width={560}>
      <div style={{ padding: mobile ? '8px 20px 24px' : '24px' }}>
        {!mobile && <p style={{ color: 'var(--c-muted)', fontSize: 13, marginTop: 0, marginBottom: 20 }}>Select your vehicle to see only the parts that fit. We'll save it across your visit.</p>}

        <div style={{ display: 'grid', gap: 14 }}>
          {showYear && <Field label="YEAR" value={year} options={YMM_DATA.years} onChange={(v) => { setYear(v); setMake(''); setModel(''); }} autoAdvance />}
          {showMake && <Field label="MAKE" value={make} options={Object.keys(YMM_DATA.makes)} onChange={(v) => { setMake(v); setModel(''); }} disabled={!year} autoAdvance />}
          {showModel && <Field label="MODEL" value={model} options={make ? YMM_DATA.makes[make] : []} onChange={setModel} disabled={!make} />}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={handleGo} disabled={!canGo} className="btn btn-primary" style={{ flex: 1 }}>
            <I.check size={14} /> CONFIRM VEHICLE
          </button>
          <button onClick={() => { setYear(''); setMake(''); setModel(''); setStep(0); }} className="btn">RESET</button>
        </div>

        <div style={{ marginTop: 20, padding: 14, background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', display: 'flex', gap: 12 }}>
          <I.shield size={18} />
          <div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', fontWeight: 600 }}>FITMENT GUARANTEED</div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>Doesn't fit? We'll refund you 100%, no questions asked.</div>
          </div>
        </div>

        <div style={{ marginTop: 16, fontSize: 12, color: 'var(--c-muted)', textAlign: 'center' }}>
          Sub-model and trim selection happens on each product page where it matters (bed length, cab type, etc.).
        </div>
      </div>
    </Modal>
  );
}

// ---------- Cart Drawer ----------
function CartDrawer({ open, onClose, lines, onCheckout, vehicle }) {
  if (!open) return null;
  const subtotal = lines.reduce((acc, l) => acc + l.price * l.qty, 0);
  const free = subtotal >= 99;

  return (
    <div className="anim-fade-in" style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="anim-slide-right" style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 460,
        background: 'var(--c-bg)', borderLeft: '1px solid var(--c-border)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="mono" style={{ fontSize: 13, letterSpacing: '0.12em', fontWeight: 600 }}>YOUR CART</div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{lines.length} item{lines.length !== 1 ? 's' : ''}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: 'var(--c-muted)', cursor: 'pointer', display: 'flex' }}><I.close size={18} /></button>
        </div>

        {/* Free shipping progress */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.1em' }}>
              {free ? '✓ FREE SHIPPING UNLOCKED' : `$${(99 - subtotal).toFixed(0)} TO FREE SHIPPING`}
            </span>
            <I.shipping size={14} />
          </div>
          <div style={{ height: 4, background: 'var(--c-surface-2)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, (subtotal / 99) * 100)}%`, background: free ? 'var(--c-success)' : 'var(--c-accent)' }} />
          </div>
        </div>

        {/* Lines */}
        {lines.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
            <I.cart size={32} />
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 16 }}>Your cart is empty</div>
            <div style={{ color: 'var(--c-muted)', fontSize: 13, marginTop: 6 }}>Find parts that fit your vehicle to get started.</div>
            <button onClick={onClose} className="btn btn-primary" style={{ marginTop: 20 }}>CONTINUE SHOPPING</button>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {lines.map((l, i) => (
              <div key={l.sku} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 14, padding: 20, borderBottom: '1px solid var(--c-border)' }}>
                <div className="product-img-bg" style={{ borderRadius: 'var(--r-sm)', overflow: 'hidden', aspectRatio: '1' }}>
                  <img src={l.image} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.35 }}>{l.title}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.08em', marginTop: 4 }}>{l.subtitle}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11, color: 'var(--c-success)' }}>
                    <I.check size={12} /><span>Fits {l.fitFor}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)' }}>
                      <button style={{ width: 28, height: 28, background: 'transparent', border: 0, color: 'var(--c-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.minus size={12} /></button>
                      <span className="mono" style={{ fontSize: 12, padding: '0 10px' }}>{l.qty}</span>
                      <button style={{ width: 28, height: 28, background: 'transparent', border: 0, color: 'var(--c-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.plus size={12} /></button>
                    </div>
                    <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>${(l.price * l.qty).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Totals + checkout */}
        {lines.length > 0 && (
          <div style={{ padding: 24, borderTop: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--c-muted)', marginBottom: 6 }}>
              <span>Subtotal</span><span className="mono">${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--c-muted)', marginBottom: 6 }}>
              <span>Shipping</span><span className="mono">{free ? 'FREE' : 'Calculated at checkout'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 600, paddingTop: 12, marginTop: 12, borderTop: '1px solid var(--c-border)' }}>
              <span>Total</span><span className="mono">${subtotal.toFixed(2)}</span>
            </div>
            <button onClick={onCheckout} className="btn btn-primary btn-lg btn-block" style={{ marginTop: 14 }}>
              CHECKOUT <I.arrowR size={14} />
            </button>
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--c-muted-2)' }}>
              <I.shield size={11} /> Secure checkout via Shopify · Powered by SSL
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Search Overlay ----------
function SearchOverlay({ open, onClose, onNav }) {
  const [q, setQ] = useState('');
  if (!open) return null;
  const suggestions = [
    { type: 'PRODUCT', title: 'Stehlen Door-Frame Mount Roof Rack', sub: '2014–2026 Ford F-150', price: '$489' },
    { type: 'PRODUCT', title: 'Stehlen Horizontal Style Grille', sub: 'Gloss Black', price: '$219' },
    { type: 'CATEGORY', title: 'Roof Racks', sub: '142 products' },
    { type: 'CATEGORY', title: 'Bed Lighting', sub: '64 products' },
    { type: 'VEHICLE', title: '2018 Ford F-150', sub: '312 fitments' },
  ];
  return (
    <div className="anim-fade-in" style={{ position: 'absolute', inset: 0, zIndex: 70, background: 'rgba(0,0,0,0.85)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)',
        padding: '24px 32px',
      }}>
        <div className="container" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <I.search size={20} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by Year Make Model, product type, or part number…"
            style={{ flex: 1, background: 'transparent', border: 0, outline: 0, color: 'var(--c-text)', fontSize: 20, fontFamily: 'var(--f-body)' }}
          />
          <button onClick={onClose} className="btn btn-sm">ESC</button>
        </div>
      </div>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--c-bg)', maxHeight: 'calc(100% - 100px)', overflowY: 'auto' }}>
        <div className="container" style={{ padding: '24px 32px' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>SUGGESTIONS</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {suggestions.map((s, i) => (
              <a key={i} href="#" onClick={(e) => { e.preventDefault(); onNav('pdp'); onClose(); }} style={{
                display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 16, alignItems: 'center',
                padding: '14px 0', borderBottom: '1px solid var(--c-border)', cursor: 'pointer',
              }}>
                <span className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--c-muted)' }}>{s.type}</span>
                <div>
                  <div style={{ fontSize: 14 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{s.sub}</div>
                </div>
                <div className="mono" style={{ fontSize: 13 }}>{s.price || ''}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.STEHLEN_OVERLAYS = { YMMSelector, CartDrawer, SearchOverlay };
