// ============================================================
// Stehlen Auto — Chrome (Announcement bar, Header, Mega Menu, Footer)
// ============================================================
const { I, Logo, VehiclePill } = window.STEHLEN_UI;

// ---------- Announcement bar ----------
function AnnouncementBar() {
  const items = [
    'FREE GROUND SHIPPING ON ORDERS $99+ — 48 STATES',
    'FITMENT GUARANTEED OR YOUR MONEY BACK',
    '300,000+ CUSTOMERS · 10+ YEARS · NOW DIRECT FROM STEHLENAUTO.COM',
    '30-DAY HASSLE-FREE RETURNS',
  ];
  return (
    <div style={{
      background: 'var(--c-text)', color: 'var(--c-bg)',
      height: 32, overflow: 'hidden', position: 'relative',
      borderBottom: '1px solid var(--c-border)',
    }}>
      <div className="marquee-track" style={{ position: 'absolute', top: 0, left: 0, height: '100%', alignItems: 'center' }}>
        {[...items, ...items, ...items].map((it, i) => (
          <span key={i} className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------- Mega menu data ----------
const MEGA = {
  'Shop by Vehicle': {
    columns: [
      { title: 'BY MAKE', items: ['Ford', 'Chevrolet', 'Ram', 'Toyota', 'Jeep', 'GMC', 'Nissan', 'Dodge', 'Honda', 'Hyundai'] },
      { title: 'POPULAR', items: ['Ford F-150', 'Chevy Silverado', 'Ram 1500', 'Toyota Tacoma', 'Jeep Wrangler', 'Toyota Tundra', 'GMC Sierra', 'Nissan Frontier'] },
      { title: 'BODY STYLE', items: ['Pickup Trucks', 'SUVs', 'Jeeps', 'Sedans', 'Coupes', 'Vans'] },
    ],
    feature: { eyebrow: 'GARAGE', title: 'Save up to 5 vehicles', body: 'Sign in to keep your fitment ready across every visit.', cta: 'Sign In' },
  },
  'Exterior': {
    columns: [
      { title: 'PROTECTION', items: ['Bumpers & Guards', 'Fender Flares', 'Bull Bars', 'Skid Plates', 'Mud Flaps'] },
      { title: 'STYLE', items: ['Grilles', 'Hood Scoops', 'Body Side Moldings', 'Door Handles', 'Side Mirrors'] },
      { title: 'FUNCTION', items: ['Running Boards', 'Side Steps', 'Roof Racks', 'Sport Bars', 'Tonneau Covers'] },
    ],
    feature: { eyebrow: 'NEW', title: 'Stehlen Modular Overland Rack', body: 'Lifetime warranty. Drilling-free door-frame mount.', cta: 'Shop Now' },
  },
  'Cargo & Bed': {
    columns: [
      { title: 'TONNEAU COVERS', items: ['Roll-Up', 'Tri-Fold', 'Hard Folding', 'Retractable'] },
      { title: 'BED PROTECTION', items: ['Bed Mats', 'Bed Liners', 'Tailgate Pads'] },
      { title: 'BED ACCESSORIES', items: ['Bed Lights', 'Tie-Downs', 'Bed Extenders', 'Toolboxes'] },
    ],
    feature: null,
  },
  'Lighting': {
    columns: [
      { title: 'EXTERIOR', items: ['Headlights', 'Tail Lights', 'Fog Lights', 'LED Light Bars', 'Auxiliary Lights'] },
      { title: 'BED & UTILITY', items: ['Bed Lights', 'Cargo Area Lights', 'Rock Lights'] },
      { title: 'INTERIOR', items: ['Dome Lights', 'Map Lights', 'Footwell Lighting'] },
    ],
    feature: null,
  },
  'Towing': {
    columns: [
      { title: 'HITCHES', items: ['Class III', 'Class IV', 'Class V', 'Receiver Hitches', 'Hitch Plugs'] },
      { title: 'ACCESSORIES', items: ['Hitch Steps', 'Hitch Mounts', 'Wiring', 'Ball Mounts'] },
      { title: 'RECOVERY', items: ['Recovery Boards', 'Tow Straps', 'D-Rings', 'Winches'] },
    ],
    feature: null,
  },
};

// ---------- Mega menu panel ----------
function MegaPanel({ data, onItemClick }) {
  if (!data) return null;
  return (
    <div className="anim-fade-in" style={{
      position: 'absolute', top: '100%', left: 0, right: 0,
      background: 'var(--c-surface)',
      borderTop: '1px solid var(--c-border)',
      borderBottom: '1px solid var(--c-border)',
      zIndex: 30,
      boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
    }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: data.feature ? 'repeat(3, 1fr) 320px' : 'repeat(3, 1fr)', gap: 32, padding: '32px' }}>
        {data.columns.map((col, i) => (
          <div key={i}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>{col.title}</div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {col.items.map((it) => (
                <li key={it}>
                  <a onClick={(e) => { e.preventDefault(); onItemClick && onItemClick(it); }} href="#" style={{ fontSize: 13, color: 'var(--c-text)', cursor: 'pointer' }}>{it}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {data.feature && (
          <div style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', padding: 20, borderRadius: 'var(--r-md)' }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--c-accent)', letterSpacing: '0.16em', marginBottom: 8 }}>{data.feature.eyebrow}</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{data.feature.title}</div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 14 }}>{data.feature.body}</div>
            <button className="btn btn-sm btn-primary">{data.feature.cta}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Header ----------
function Header({ vehicle, onYMMOpen, onCartOpen, onSearchOpen, onNav, cartCount = 0, page = 'home', mobile = false }) {
  const [hover, setHover] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  if (mobile) {
    return (
      <>
        <AnnouncementBar />
        <div style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: 'var(--c-bg)',
          borderBottom: '1px solid var(--c-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', gap: 12 }}>
            <button onClick={() => setMobileMenu(true)} style={{ background: 'transparent', border: 0, color: 'var(--c-text)', cursor: 'pointer', display: 'flex' }}>
              <I.menu size={22} />
            </button>
            <a href="#" onClick={(e) => { e.preventDefault(); onNav && onNav('home'); }}><Logo height={20} /></a>
            <div style={{ display: 'flex', gap: 14 }}>
              <button onClick={onSearchOpen} style={{ background: 'transparent', border: 0, color: 'var(--c-text)', cursor: 'pointer', display: 'flex' }}>
                <I.search size={20} />
              </button>
              <button onClick={onCartOpen} style={{ background: 'transparent', border: 0, color: 'var(--c-text)', cursor: 'pointer', display: 'flex', position: 'relative' }}>
                <I.cart size={20} />
                {cartCount > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -6, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: 'var(--c-accent)', color: 'var(--c-bg)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>
                )}
              </button>
            </div>
          </div>
          <div style={{ padding: '8px 16px 12px', borderTop: '1px solid var(--c-border)' }}>
            <button onClick={onYMMOpen} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              height: 40, padding: '0 12px',
              background: 'var(--c-surface)', border: '1px solid var(--c-border)',
              borderRadius: 'var(--r-md)', cursor: 'pointer', color: 'var(--c-text)',
            }}>
              {vehicle ? (
                <>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c-success)' }} />
                  <span className="mono" style={{ fontSize: 11, letterSpacing: '0.08em' }}>{vehicle.year} {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--c-muted)', fontSize: 11 }}>CHANGE</span>
                </>
              ) : (
                <>
                  <I.truck size={14} />
                  <span className="mono" style={{ fontSize: 11, letterSpacing: '0.08em' }}>SELECT YOUR VEHICLE</span>
                </>
              )}
            </button>
          </div>
        </div>
        {mobileMenu && <MobileMenu onClose={() => setMobileMenu(false)} onNav={(p) => { setMobileMenu(false); onNav && onNav(p); }} />}
      </>
    );
  }

  return (
    <>
      <AnnouncementBar />
      {/* Utility strip */}
      <div style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 36 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <a href="tel:18883784536" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', color: 'var(--c-muted)', fontSize: 12 }}>
              <I.phone size={12} /><span className="mono" style={{ letterSpacing: '0.08em' }}>1-888-378-4536</span>
            </a>
            <a href="#" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', color: 'var(--c-muted)', fontSize: 12 }}>
              <I.chat size={12} /><span>Live Chat</span>
            </a>
            <span style={{ color: 'var(--c-muted)', fontSize: 12 }}>Mon–Fri 9–5 PST</span>
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.12em' }}>PREVIOUSLY ON EBAY · NOW DIRECT</span>
            <a href="#" style={{ color: 'var(--c-muted)', fontSize: 12 }}>Order Status</a>
            <a href="#" style={{ color: 'var(--c-muted)', fontSize: 12 }}>Help</a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'var(--c-bg)',
        borderBottom: '1px solid var(--c-border)',
      }}
        onMouseLeave={() => setHover(null)}
      >
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', alignItems: 'center', gap: 32, height: 72 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); onNav && onNav('home'); }}>
            <Logo height={28} />
          </a>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-muted)', display: 'flex' }}>
              <I.search size={16} />
            </span>
            <input
              onClick={onSearchOpen}
              readOnly
              placeholder="Search by Year Make Model, product type, or part number…"
              className="input"
              style={{ paddingLeft: 40, height: 44, fontFamily: 'var(--f-body)', fontSize: 13, textTransform: 'none', letterSpacing: 0, cursor: 'text' }}
            />
            <span className="mono" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--c-muted-2)', letterSpacing: '0.1em', border: '1px solid var(--c-border)', padding: '2px 6px', borderRadius: 3 }}>⌘ K</span>
          </div>

          {/* Right cluster */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <VehiclePill vehicle={vehicle} onChange={onYMMOpen} />
            <button onClick={() => onNav && onNav('account')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'transparent', border: 0, color: 'var(--c-text)', cursor: 'pointer' }}>
              <I.garage size={20} />
              <span className="mono" style={{ fontSize: 9, letterSpacing: '0.1em', color: 'var(--c-muted)' }}>GARAGE</span>
            </button>
            <button onClick={onCartOpen} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'transparent', border: 0, color: 'var(--c-text)', cursor: 'pointer', position: 'relative' }}>
              <I.cart size={20} />
              <span className="mono" style={{ fontSize: 9, letterSpacing: '0.1em', color: 'var(--c-muted)' }}>CART</span>
              {cartCount > 0 && (
                <span style={{ position: 'absolute', top: -2, right: -6, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: 'var(--c-accent)', color: 'var(--c-bg)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Mega nav */}
        <div style={{ borderTop: '1px solid var(--c-border)' }}>
          <div className="container" style={{ display: 'flex', gap: 0, height: 44, alignItems: 'stretch' }}>
            {Object.keys(MEGA).map((label) => (
              <div
                key={label}
                onMouseEnter={() => setHover(label)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '0 18px', cursor: 'pointer',
                  borderBottom: hover === label ? '2px solid var(--c-accent)' : '2px solid transparent',
                  marginBottom: -1,
                }}
                onClick={() => { onNav && onNav('collection'); setHover(null); }}
              >
                <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500 }}>{label}</span>
                <I.chevDown size={10} />
              </div>
            ))}
            <div style={{ flex: 1 }} />
            <a href="#" style={{ display: 'flex', alignItems: 'center', padding: '0 18px', color: 'var(--c-accent)' }}>
              <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', fontWeight: 600 }}>SALE</span>
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); onNav && onNav('collection'); }} style={{ display: 'flex', alignItems: 'center', padding: '0 18px' }}>
              <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--c-muted)' }}>NEW ARRIVALS</span>
            </a>
          </div>
          {hover && <MegaPanel data={MEGA[hover]} onItemClick={() => { onNav && onNav('collection'); setHover(null); }} />}
        </div>
      </div>
    </>
  );
}

// ---------- Mobile menu drawer ----------
function MobileMenu({ onClose, onNav }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="anim-slide-right" style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '88%', maxWidth: 380,
        background: 'var(--c-bg)', borderLeft: '1px solid var(--c-border)',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--c-border)' }}>
          <Logo height={18} />
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: 'var(--c-text)', display: 'flex' }}><I.close size={20} /></button>
        </div>
        {Object.keys(MEGA).map((label) => (
          <a key={label} href="#" onClick={(e) => { e.preventDefault(); onNav('collection'); }} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 20px', borderBottom: '1px solid var(--c-border)',
          }}>
            <span className="mono" style={{ fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
            <I.chevRight size={16} />
          </a>
        ))}
        <div style={{ padding: 20 }}>
          <button className="btn btn-block" style={{ marginBottom: 8 }}>Sign In</button>
          <button className="btn btn-block">Live Chat</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Footer ----------
function Footer() {
  return (
    <footer style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', marginTop: 80 }}>
      {/* Newsletter */}
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, padding: '40px 0', alignItems: 'center' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--c-accent)', marginBottom: 8 }}>NEWSLETTER</div>
            <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 28, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>BUILD YOUR RIG WITH US.</h3>
            <p style={{ color: 'var(--c-muted)', marginTop: 8, maxWidth: 480 }}>$25 off your first order over $200. Plus new-product drops, install guides, and customer build features.</p>
          </div>
          <form style={{ display: 'flex', gap: 8 }} onSubmit={(e) => e.preventDefault()}>
            <input className="input" placeholder="you@example.com" style={{ flex: 1 }} />
            <button className="btn btn-primary">SUBSCRIBE</button>
          </form>
        </div>
      </div>

      {/* Links */}
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', gap: 48, padding: '48px 0' }}>
        <div>
          <Logo height={26} />
          <p style={{ color: 'var(--c-muted)', fontSize: 13, marginTop: 16, lineHeight: 1.6 }}>
            Heavy-duty truck, SUV, and Jeep accessories. Fitment guaranteed. Trusted by 300,000+ customers since 2015.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            {['Facebook','Instagram','YouTube','TikTok'].map(n => (
              <a key={n} href="#" style={{
                width: 36, height: 36, border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-muted)', fontSize: 11
              }} className="mono">{n[0]}</a>
            ))}
          </div>
        </div>
        {[
          { h: 'SHOP', items: ['Shop by Vehicle','New Arrivals','Best Sellers','Sale','Gift Cards'] },
          { h: 'SUPPORT', items: ['Contact Us','Order Status','Returns','Shipping','Fitment Help','Installation Guides'] },
          { h: 'COMPANY', items: ['About','Reviews','Careers','Wholesale','Affiliates','Press'] },
          { h: 'LEGAL', items: ['Terms','Privacy','Warranty','CCPA','Prop 65','Accessibility'] },
        ].map((col) => (
          <div key={col.h}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>{col.h}</div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {col.items.map(it => <li key={it}><a href="#" style={{ fontSize: 13, color: 'var(--c-muted)' }}>{it}</a></li>)}
            </ul>
          </div>
        ))}
      </div>

      {/* Sub footer */}
      <div style={{ borderTop: '1px solid var(--c-border)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ color: 'var(--c-muted)', fontSize: 12 }}>© 2026 Stehlen Auto. All Rights Reserved. 1160 W. Rincon St, Corona, CA 92878.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['VISA','MC','AMEX','DISC','PYPL','AFRM','SHOP'].map(p => (
              <span key={p} className="mono" style={{ fontSize: 9, padding: '4px 8px', border: '1px solid var(--c-border)', color: 'var(--c-muted)', letterSpacing: '0.1em' }}>{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

window.STEHLEN_CHROME = { Header, Footer, AnnouncementBar };
