// ============================================================
// Stehlen Auto — Account / Garage
// ============================================================
const { I, Stars } = window.STEHLEN_UI;

function AccountPage({ onNav, onYMMOpen, mobile, vehicle }) {
  const [tab, setTab] = useState('overview');

  const tabs = [
    { id: 'overview',  label: 'OVERVIEW' },
    { id: 'garage',    label: 'GARAGE' },
    { id: 'orders',    label: 'ORDERS' },
    { id: 'addresses', label: 'ADDRESSES' },
    { id: 'reviews',   label: 'REVIEWS' },
    { id: 'wishlist',  label: 'WISHLIST' },
    { id: 'settings',  label: 'SETTINGS' },
  ];

  return (
    <main>
      {/* HERO */}
      <div style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile ? '32px 0 0' : '48px 0 0' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>ACCOUNT · MEMBER SINCE 2021</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 40 : 64, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 0.95 }}>
            HEY, MIKE.
          </h1>
          <p style={{ color: 'var(--c-muted)', marginTop: 12, fontSize: 15 }}>
            Your garage, orders, and saved builds — all in one place.
          </p>
          {/* Tabs */}
          <div style={{ marginTop: 32, display: 'flex', gap: 0, overflowX: 'auto', borderBottom: '1px solid transparent' }} className="no-scrollbar">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: 'transparent', border: 0, cursor: 'pointer',
                padding: '14px 18px',
                borderBottom: tab === t.id ? '2px solid var(--c-accent)' : '2px solid transparent',
                marginBottom: -1,
                color: tab === t.id ? 'var(--c-text)' : 'var(--c-muted)',
                whiteSpace: 'nowrap',
              }}>
                <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: tab === t.id ? 700 : 500 }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: mobile ? '32px 0' : '48px 0' }}>
        {tab === 'overview' && <Overview onTab={setTab} onNav={onNav} mobile={mobile} />}
        {tab === 'garage' && <Garage onYMMOpen={onYMMOpen} vehicle={vehicle} mobile={mobile} />}
        {tab === 'orders' && <Orders onNav={onNav} mobile={mobile} />}
        {tab === 'addresses' && <Addresses mobile={mobile} />}
        {tab === 'reviews' && <ReviewsTab mobile={mobile} />}
        {tab === 'wishlist' && <Wishlist onNav={onNav} mobile={mobile} />}
        {tab === 'settings' && <Settings mobile={mobile} />}
      </div>
    </main>
  );
}

// ---------- OVERVIEW ----------
function Overview({ onTab, onNav, mobile }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr', gap: 16 }}>
      <StatCard num="3" label="ACTIVE ORDERS" sub="Most recent: in transit" cta="VIEW" onClick={() => onTab('orders')} />
      <StatCard num="2" label="VEHICLES IN GARAGE" sub="Add up to 5" cta="MANAGE" onClick={() => onTab('garage')} />
      <StatCard num="$1,247" label="LIFETIME LOYALTY" sub="$62 in rewards available" cta="REDEEM" highlight />

      {/* Recent orders */}
      <div style={{ gridColumn: mobile ? 'auto' : 'span 2' }}>
        <SectionHeading title="RECENT ORDERS" cta="View all" onCta={() => onTab('orders')} />
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
          {SAMPLE_ORDERS.slice(0, 2).map((o, i) => (
            <OrderRow key={o.id} order={o} onNav={onNav} divider={i < 1} />
          ))}
        </div>
      </div>

      {/* Garage preview */}
      <div>
        <SectionHeading title="GARAGE" cta="Manage" onCta={() => onTab('garage')} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SAMPLE_VEHICLES.slice(0, 2).map(v => <VehicleMini key={v.id} v={v} />)}
        </div>
      </div>

      {/* Recommended */}
      <div style={{ gridColumn: mobile ? 'auto' : 'span 3' }}>
        <SectionHeading title="BUILT FOR YOUR F-150" />
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16 }}>
          {window.STEHLEN_DATA.PRODUCTS.slice(0, 4).map(p => (
            <window.ProductCard key={p.sku} product={p} density="standard" onOpen={() => onNav('pdp')} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ num, label, sub, cta, onClick, highlight }) {
  return (
    <div style={{
      background: highlight ? 'var(--c-accent)' : 'var(--c-surface)',
      color: highlight ? 'var(--c-accent-ink)' : 'var(--c-text)',
      border: `1px solid ${highlight ? 'var(--c-accent)' : 'var(--c-border)'}`,
      borderRadius: 'var(--r-md)',
      padding: 20,
    }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', fontWeight: 600, opacity: 0.8 }}>{label}</div>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 6, lineHeight: 1 }}>{num}</div>
      <div style={{ fontSize: 12, marginTop: 8, opacity: 0.75 }}>{sub}</div>
      {cta && (
        <button onClick={onClick} className="btn btn-sm" style={{
          marginTop: 14,
          background: highlight ? 'var(--c-bg)' : 'transparent',
          color: highlight ? 'var(--c-text)' : 'var(--c-text)',
          borderColor: highlight ? 'var(--c-bg)' : 'var(--c-border)',
        }}>{cta}</button>
      )}
    </div>
  );
}

function SectionHeading({ title, cta, onCta }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, marginTop: 8 }}>
      <h3 className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', fontWeight: 600 }}>{title}</h3>
      {cta && <button onClick={onCta} style={{ background: 'transparent', border: 0, color: 'var(--c-muted)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>{cta}</button>}
    </div>
  );
}

// ---------- GARAGE ----------
function Garage({ onYMMOpen, vehicle, mobile }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 28, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>YOUR GARAGE</h2>
          <p style={{ color: 'var(--c-muted)', fontSize: 13, marginTop: 4 }}>Save up to 5 vehicles. Active vehicle filters your search and product fitment.</p>
        </div>
        <button onClick={onYMMOpen} className="btn btn-primary"><I.plus size={14}/> ADD VEHICLE</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
        {SAMPLE_VEHICLES.map(v => <VehicleCard key={v.id} v={v} active={v.active} />)}
        <button onClick={onYMMOpen} style={{
          background: 'transparent',
          border: '1px dashed var(--c-border-2)',
          borderRadius: 'var(--r-md)',
          padding: 32,
          color: 'var(--c-muted)',
          cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          minHeight: 200,
          justifyContent: 'center',
        }}>
          <I.plus size={24} />
          <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', fontWeight: 600 }}>ADD A VEHICLE</span>
          <span style={{ fontSize: 12 }}>3 of 5 slots remaining</span>
        </button>
      </div>
    </div>
  );
}

function VehicleCard({ v, active }) {
  return (
    <div style={{
      background: 'var(--c-surface)',
      border: `1px solid ${active ? 'var(--c-accent)' : 'var(--c-border)'}`,
      borderRadius: 'var(--r-md)',
      padding: 24,
      position: 'relative',
    }}>
      {active && (
        <span className="badge badge-best" style={{ position: 'absolute', top: 12, right: 12 }}>ACTIVE</span>
      )}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{
          width: 64, height: 64,
          background: 'var(--c-surface-2)',
          border: '1px solid var(--c-border)',
          borderRadius: 'var(--r-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--c-accent)',
          flexShrink: 0,
        }}>
          <I.truck size={28} />
        </div>
        <div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', letterSpacing: '0.1em' }}>{v.year}</div>
          <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 22, textTransform: 'uppercase', letterSpacing: '-0.01em', marginTop: 2 }}>{v.make} {v.model}</h3>
          <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 4 }}>{v.trim} · {v.bed}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, paddingTop: 16, borderTop: '1px solid var(--c-border)' }}>
        <Stat n={v.fits} label="FITTING PARTS" />
        <Stat n={v.purchases} label="PARTS INSTALLED" />
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {!active && <button className="btn btn-sm" style={{ flex: 1 }}>SET ACTIVE</button>}
        <button className="btn btn-sm" style={{ flex: 1 }}>SHOP PARTS</button>
        <button className="btn btn-sm" aria-label="More" style={{ width: 36, padding: 0 }}><I.minus size={12} /></button>
      </div>
    </div>
  );
}

function VehicleMini({ v }) {
  return (
    <div style={{
      background: 'var(--c-surface)',
      border: '1px solid var(--c-border)',
      borderRadius: 'var(--r-md)',
      padding: 14,
      display: 'flex', gap: 12, alignItems: 'center',
    }}>
      <div style={{ width: 40, height: 40, background: 'var(--c-surface-2)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-accent)' }}>
        <I.truck size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.1em' }}>{v.year}</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{v.make} {v.model}</div>
      </div>
      {v.active && <span className="chip chip-success">ACTIVE</span>}
    </div>
  );
}

function Stat({ n, label }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 700 }}>{n}</div>
      <div className="mono" style={{ fontSize: 9, letterSpacing: '0.12em', color: 'var(--c-muted)' }}>{label}</div>
    </div>
  );
}

// ---------- ORDERS ----------
function Orders({ onNav, mobile }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 28, textTransform: 'uppercase' }}>ORDER HISTORY</h2>
        <select className="select" style={{ width: 220 }}>
          <option>ALL ORDERS</option>
          <option>LAST 30 DAYS</option>
          <option>LAST 6 MONTHS</option>
          <option>2025</option>
          <option>2024</option>
        </select>
      </div>
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
        {SAMPLE_ORDERS.map((o, i) => (
          <OrderRow key={o.id} order={o} onNav={onNav} divider={i < SAMPLE_ORDERS.length - 1} mobile={mobile} />
        ))}
      </div>
    </div>
  );
}

function OrderRow({ order, onNav, divider, mobile }) {
  const statusColor = {
    'In transit': 'var(--c-accent)',
    'Delivered': 'var(--c-success)',
    'Processing': 'var(--c-muted)',
  }[order.status];
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr' : '110px 1fr 140px 130px 110px',
      gap: 16, padding: 20, alignItems: 'center',
      borderBottom: divider ? '1px solid var(--c-border)' : 0,
    }}>
      {/* thumbnails */}
      <div style={{ display: 'flex', gap: -4 }}>
        {order.items.slice(0, 3).map((it, i) => (
          <div key={i} className="product-img-bg" style={{
            width: 44, height: 44, borderRadius: 'var(--r-sm)',
            border: '1px solid var(--c-border)', marginLeft: i === 0 ? 0 : -10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--c-surface-2)',
          }}>
            <img src={it.image} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
          </div>
        ))}
      </div>
      <div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', letterSpacing: '0.08em' }}>ORDER #{order.id} · {order.date}</div>
        <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>{order.summary}</div>
        <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{order.items.length} items · for {order.vehicle}</div>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
          <span className="mono" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em' }}>{order.status.toUpperCase()}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 4 }}>{order.statusSub}</div>
      </div>
      <div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>${order.total.toFixed(2)}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button className="btn btn-sm">DETAILS</button>
        <button className="btn btn-sm">TRACK</button>
      </div>
    </div>
  );
}

// ---------- ADDRESSES ----------
function Addresses({ mobile }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 28, textTransform: 'uppercase' }}>SAVED ADDRESSES</h2>
        <button className="btn btn-primary"><I.plus size={14}/> ADD ADDRESS</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
        {SAMPLE_ADDRESSES.map((a, i) => (
          <div key={i} style={{
            background: 'var(--c-surface)',
            border: `1px solid ${a.default ? 'var(--c-accent)' : 'var(--c-border)'}`,
            borderRadius: 'var(--r-md)', padding: 20, position: 'relative',
          }}>
            {a.default && <span className="badge badge-best" style={{ position: 'absolute', top: 12, right: 12 }}>DEFAULT</span>}
            <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.14em', marginBottom: 8 }}>{a.label}</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</div>
            <div style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 6, lineHeight: 1.6 }}>
              {a.line1}<br/>{a.city}, {a.state} {a.zip}<br/>{a.phone}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
              <button className="btn btn-sm">EDIT</button>
              {!a.default && <button className="btn btn-sm">SET DEFAULT</button>}
              <button className="btn btn-sm" aria-label="delete"><I.trash size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- REVIEWS ----------
function ReviewsTab({ mobile }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 28, textTransform: 'uppercase', marginBottom: 20 }}>YOUR REVIEWS</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {SAMPLE_REVIEWS.map((r, i) => (
          <div key={i} style={{
            background: 'var(--c-surface)', border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-md)', padding: 20,
            display: 'grid', gridTemplateColumns: mobile ? '1fr' : '80px 1fr auto', gap: 16, alignItems: 'flex-start',
          }}>
            <div className="product-img-bg" style={{ width: 80, height: 80, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={r.image} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
            </div>
            <div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>{r.date} · {r.product}</div>
              <Stars rating={r.rating} size={13} />
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{r.title}</div>
              <p style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 6, lineHeight: 1.55 }}>{r.body}</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm">EDIT</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- WISHLIST ----------
function Wishlist({ onNav, mobile }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 28, textTransform: 'uppercase', marginBottom: 20 }}>WISHLIST · {window.STEHLEN_DATA.PRODUCTS.slice(0, 4).length}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16 }}>
        {window.STEHLEN_DATA.PRODUCTS.slice(0, 4).map(p => <window.ProductCard key={p.sku} product={p} density="standard" onOpen={() => onNav('pdp')} />)}
      </div>
    </div>
  );
}

// ---------- SETTINGS ----------
function Settings({ mobile }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 16 }}>
      <SettingCard title="PROFILE">
        <div className="label-eyebrow">FIRST NAME</div>
        <input className="input" defaultValue="Mike" style={{ marginBottom: 12 }} />
        <div className="label-eyebrow">LAST NAME</div>
        <input className="input" defaultValue="Rodriguez" style={{ marginBottom: 12 }} />
        <div className="label-eyebrow">EMAIL</div>
        <input className="input" defaultValue="mike.rodriguez@example.com" style={{ marginBottom: 12 }} />
        <button className="btn btn-primary" style={{ marginTop: 8 }}>SAVE CHANGES</button>
      </SettingCard>
      <SettingCard title="PASSWORD">
        <div className="label-eyebrow">CURRENT</div>
        <input className="input" type="password" defaultValue="••••••••" style={{ marginBottom: 12 }} />
        <div className="label-eyebrow">NEW</div>
        <input className="input" type="password" style={{ marginBottom: 12 }} />
        <div className="label-eyebrow">CONFIRM NEW</div>
        <input className="input" type="password" style={{ marginBottom: 12 }} />
        <button className="btn btn-primary" style={{ marginTop: 8 }}>UPDATE PASSWORD</button>
      </SettingCard>
      <SettingCard title="NOTIFICATIONS">
        {[
          'Order updates & shipping',
          'New product drops',
          'Promotions & sale events',
          'Install guides for items I bought',
          'Vehicle-specific recommendations',
        ].map((l, i) => (
          <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', fontSize: 13 }}>
            <input type="checkbox" defaultChecked={i < 3} /> {l}
          </label>
        ))}
      </SettingCard>
      <SettingCard title="DANGER ZONE" danger>
        <p style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 12 }}>Permanently delete your account and all associated data. This action cannot be undone.</p>
        <button className="btn" style={{ borderColor: 'var(--c-danger)', color: 'var(--c-danger)' }}>DELETE ACCOUNT</button>
      </SettingCard>
    </div>
  );
}

function SettingCard({ title, children, danger }) {
  return (
    <div style={{
      background: 'var(--c-surface)',
      border: `1px solid ${danger ? 'rgba(239,68,68,0.4)' : 'var(--c-border)'}`,
      borderRadius: 'var(--r-md)', padding: 24,
    }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 600, color: danger ? 'var(--c-danger)' : 'var(--c-text)', marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

// ---------- SAMPLE DATA ----------
const SAMPLE_VEHICLES = [
  { id: 1, year: 2018, make: 'Ford', model: 'F-150', trim: 'XLT SuperCrew', bed: '5.5\' Bed', fits: '1,322', purchases: 8, active: true },
  { id: 2, year: 2014, make: 'Jeep', model: 'Wrangler', trim: 'Sport Unlimited', bed: '4-Door', fits: '847', purchases: 3, active: false },
];

const SAMPLE_ORDERS = [
  {
    id: 'STH-284-9817', date: 'Today',
    summary: 'Door-Frame Mount Roof Rack + Horizontal Grille',
    items: [
      { image: 'assets/product-roof-rack.webp' },
      { image: 'assets/product-grille.webp' },
    ],
    vehicle: '2018 Ford F-150',
    status: 'Processing', statusSub: 'Ships within 24h',
    total: 768.45,
  },
  {
    id: 'STH-281-4422', date: 'Mar 12',
    summary: 'Stehlen Tonneau Cover · Lock & Roll-Up',
    items: [
      { image: 'assets/product-tonneau-cover.jpg' },
    ],
    vehicle: '2018 Ford F-150',
    status: 'In transit', statusSub: 'Arrives Friday',
    total: 389.00,
  },
  {
    id: 'STH-264-1108', date: 'Feb 28',
    summary: 'Bed Light Kit + Modular Bumper',
    items: [
      { image: 'assets/product-bed-lights.webp' },
      { image: 'assets/bumper-modular.jpg' },
    ],
    vehicle: '2018 Ford F-150',
    status: 'Delivered', statusSub: 'Mar 03',
    total: 1124.50,
  },
  {
    id: 'STH-241-9203', date: 'Jan 14',
    summary: 'Heavy-Duty Crossbar Set',
    items: [
      { image: 'assets/product-roof-rack.webp' },
    ],
    vehicle: '2014 Jeep Wrangler',
    status: 'Delivered', statusSub: 'Jan 19',
    total: 329.00,
  },
];

const SAMPLE_ADDRESSES = [
  { label: 'HOME · DEFAULT SHIPPING', name: 'Mike Rodriguez', line1: '2418 W Cactus Rd', city: 'Phoenix', state: 'AZ', zip: '85029', phone: '(602) 555-0188', default: true },
  { label: 'SHOP', name: 'Mike Rodriguez', line1: '11200 N 19th Ave, Bay 4', city: 'Phoenix', state: 'AZ', zip: '85029', phone: '(602) 555-0188', default: false },
];

const SAMPLE_REVIEWS = [
  { date: 'Mar 05', product: 'Stehlen Tonneau Cover', image: 'assets/product-tonneau-cover.jpg', rating: 5, title: 'Bolted on in 25 minutes flat.', body: 'Did exactly what they said it would. No drilling, no headaches. Locks tight and the seal kept everything bone-dry through two storms.' },
  { date: 'Feb 02', product: 'Stehlen Modular Bumper', image: 'assets/bumper-modular.jpg', rating: 5, title: 'Built like a tank.', body: 'Heavy, well-finished, and lined up with every factory hole on my truck. Stehlen support was sharp when I had a fitment question.' },
];

window.AccountPage = AccountPage;
