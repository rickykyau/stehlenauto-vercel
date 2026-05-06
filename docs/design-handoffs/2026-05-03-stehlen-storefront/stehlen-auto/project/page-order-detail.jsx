// ============================================================
// Stehlen Auto — Order Detail / Tracking
// ============================================================
const { I } = window.STEHLEN_UI;

function OrderDetailPage({ onNav, mobile }) {
  const { CART_LINES } = window.STEHLEN_DATA;
  const orderNum = 'STH-281-4422';
  const subtotal = CART_LINES.reduce((s, l) => s + l.price * l.qty, 0);
  const shipping = 0;
  const tax = subtotal * 0.0875;
  const total = subtotal + tax;

  // Tracking events (most recent first)
  const events = [
    { date: 'Apr 30 · 9:42 AM', loc: 'Phoenix, AZ',     status: 'Out for delivery',         active: true },
    { date: 'Apr 30 · 4:18 AM', loc: 'Phoenix, AZ',     status: 'Arrived at local facility' },
    { date: 'Apr 29 · 11:02 PM',loc: 'Las Vegas, NV',   status: 'In transit' },
    { date: 'Apr 29 · 6:50 AM', loc: 'Ontario, CA',     status: 'Departed origin facility' },
    { date: 'Apr 28 · 2:14 PM', loc: 'Corona, CA',      status: 'Picked up by FedEx' },
    { date: 'Apr 28 · 9:11 AM', loc: 'Corona, CA',      status: 'Label created' },
  ];

  const stages = [
    { label: 'PLACED',     done: true,  active: false },
    { label: 'PROCESSED',  done: true,  active: false },
    { label: 'SHIPPED',    done: true,  active: false },
    { label: 'IN TRANSIT', done: false, active: true },
    { label: 'DELIVERED',  done: false, active: false },
  ];

  return (
    <main>
      {/* BREADCRUMB */}
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: '14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); onNav('account'); }} className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', letterSpacing: '0.1em' }}>ACCOUNT</a>
          <I.chevRight size={11} stroke="var(--c-muted-2)" />
          <a href="#" onClick={(e) => { e.preventDefault(); onNav('account'); }} className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', letterSpacing: '0.1em' }}>ORDERS</a>
          <I.chevRight size={11} stroke="var(--c-muted-2)" />
          <span className="mono" style={{ fontSize: 11, letterSpacing: '0.1em' }}>{orderNum}</span>
        </div>
      </div>

      {/* HERO HEADER */}
      <div style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile ? '32px 0' : '48px 0', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr auto', gap: 24, alignItems: 'flex-end' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>ORDER #{orderNum} · PLACED MAR 12, 2026</div>
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 36 : 56, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 0.95 }}>
              ARRIVING TODAY
            </h1>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--c-accent)', boxShadow: '0 0 0 4px rgba(245,168,35,0.2)' }} />
                <span className="mono" style={{ fontSize: 12, letterSpacing: '0.1em', fontWeight: 600 }}>OUT FOR DELIVERY</span>
              </span>
              <span style={{ color: 'var(--c-muted)', fontSize: 13 }}>FedEx · Tracking <span className="mono" style={{ color: 'var(--c-text)' }}>772 8451 0938</span></span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn"><I.external size={12} /> TRACK ON FEDEX</button>
            <button onClick={() => onNav('returns')} className="btn">START A RETURN</button>
          </div>
        </div>
      </div>

      {/* STAGE BAR */}
      <div className="container" style={{ padding: mobile ? '24px 0 0' : '40px 0 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length}, 1fr)`, gap: 0, position: 'relative' }}>
          {stages.map((s, i) => {
            const reached = s.done || s.active;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {/* Connector line */}
                {i > 0 && (
                  <div style={{
                    position: 'absolute', top: 14, right: '50%', height: 2, width: '100%',
                    background: stages[i-1].done && reached ? 'var(--c-success)' : 'var(--c-border)',
                  }} />
                )}
                <span style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: s.done ? 'var(--c-success)' : (s.active ? 'var(--c-accent)' : 'var(--c-bg)'),
                  border: !s.done && !s.active ? '2px solid var(--c-border-2)' : 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', zIndex: 2,
                  boxShadow: s.active ? '0 0 0 6px rgba(245,168,35,0.18)' : 'none',
                }}>
                  {s.done ? <I.check size={14} stroke="var(--c-bg)" sw={3}/> : (
                    <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: s.active ? 'var(--c-bg)' : 'var(--c-muted-2)' }}>{i + 1}</span>
                  )}
                </span>
                <span className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', fontWeight: s.active ? 700 : 500, color: reached ? 'var(--c-text)' : 'var(--c-muted-2)', marginTop: 8, textAlign: 'center' }}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAP + TIMELINE */}
      <div className="container" style={{ padding: mobile ? '24px 0' : '40px 0', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1.2fr 1fr', gap: 24 }}>
        {/* Map placeholder + delivery card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            position: 'relative',
            background: 'var(--c-surface)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-md)',
            overflow: 'hidden',
            aspectRatio: '16 / 9',
          }}>
            {/* SVG map placeholder — abstracted route lines */}
            <svg viewBox="0 0 600 340" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid slice">
              <defs>
                <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M32 0H0V32" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="600" height="340" fill="#1a1a1a" />
              <rect width="600" height="340" fill="url(#grid)" />
              {/* Route */}
              <path d="M80,260 C200,220 280,240 360,180 S520,100 540,80" fill="none" stroke="#383838" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M80,260 C200,220 280,240 360,180" fill="none" stroke="#f5a823" strokeWidth="3" />
              {/* origin */}
              <circle cx="80" cy="260" r="6" fill="#22c55e" />
              <circle cx="80" cy="260" r="14" fill="none" stroke="#22c55e" strokeOpacity="0.4" strokeWidth="2" />
              {/* current */}
              <circle cx="360" cy="180" r="8" fill="#f5a823" />
              <circle cx="360" cy="180" r="18" fill="none" stroke="#f5a823" strokeOpacity="0.4" strokeWidth="2">
                <animate attributeName="r" values="14;28;14" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.4;0;0.4" dur="2.4s" repeatCount="indefinite" />
              </circle>
              {/* destination */}
              <circle cx="540" cy="80" r="6" fill="none" stroke="#a0a0a0" strokeWidth="2" />
            </svg>
            {/* corner labels */}
            <div className="mono" style={{ position: 'absolute', top: 14, left: 14, fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.14em' }}>LIVE TRACKING</div>
            <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--c-success)', letterSpacing: '0.12em' }}>● ORIGIN</div>
                <div style={{ marginTop: 2, color: 'var(--c-muted)' }}>Corona, CA</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 9, color: 'var(--c-accent)', letterSpacing: '0.12em' }}>● VEHICLE</div>
                <div style={{ marginTop: 2, color: 'var(--c-muted)' }}>Phoenix, AZ</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 9, color: 'var(--c-muted)', letterSpacing: '0.12em' }}>○ DESTINATION</div>
                <div style={{ marginTop: 2, color: 'var(--c-muted)' }}>2418 W Cactus Rd</div>
              </div>
            </div>
          </div>

          {/* ETA card */}
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr', gap: 0, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            <Stat label="ETA" value="TODAY" sub="By 8:00 PM" highlight />
            <Stat label="STOPS LEFT" value="14" sub="Driver: Carlos M." />
            <Stat label="MILES OUT" value="11.4" sub="From your address" />
          </div>
        </div>

        {/* TIMELINE */}
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', fontWeight: 600 }}>SHIPMENT EVENTS</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.1em' }}>{events.length} UPDATES</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {events.map((e, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', padding: '14px 20px', alignItems: 'flex-start', position: 'relative' }}>
                <div style={{ position: 'relative', height: 18, display: 'flex', justifyContent: 'center' }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: e.active ? 'var(--c-accent)' : (i === 0 ? 'var(--c-success)' : 'var(--c-muted-2)'),
                    boxShadow: e.active ? '0 0 0 4px rgba(245,168,35,0.2)' : 'none',
                    marginTop: 4,
                    zIndex: 2,
                  }} />
                  {i < events.length - 1 && <span style={{ position: 'absolute', top: 14, bottom: -14, left: '50%', width: 1, background: 'var(--c-border)' }} />}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: e.active ? 600 : 500 }}>{e.status}</div>
                  <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{e.loc}</div>
                </div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.06em', textAlign: 'right' }}>{e.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ITEMS + DETAILS */}
      <div className="container" style={{ padding: '0 0 32px', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 380px', gap: 32 }}>
        {/* Items */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span className="eyebrow">ITEMS · {CART_LINES.length}</span>
            <button className="btn btn-sm">DOWNLOAD INVOICE</button>
          </div>
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            {CART_LINES.map((l, i) => (
              <div key={l.sku} style={{
                display: 'grid', gridTemplateColumns: mobile ? '64px 1fr' : '80px 1fr auto auto', gap: 16, padding: 16, alignItems: 'center',
                borderBottom: i < CART_LINES.length - 1 ? '1px solid var(--c-border)' : 0,
              }}>
                <div className="product-img-bg" style={{ width: mobile ? 64 : 80, height: mobile ? 64 : 80, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={l.image} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{l.title}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.08em' }}>SKU {l.sku} · QTY {l.qty}</div>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <I.check size={11} stroke="var(--c-success)" />
                    <span className="mono" style={{ fontSize: 10, color: 'var(--c-success)', letterSpacing: '0.08em' }}>FITS {l.fitFor.toUpperCase()}</span>
                  </div>
                </div>
                {!mobile && <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>${(l.price * l.qty).toFixed(2)}</span>}
                {!mobile && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button className="btn btn-sm">BUY AGAIN</button>
                    <button className="btn btn-sm">REVIEW</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Install resources card */}
          <div style={{ marginTop: 20, background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <I.wrench size={14} stroke="var(--c-accent)" />
              <span className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', fontWeight: 600 }}>INSTALL RESOURCES FOR YOUR ORDER</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 0 }}>
              {[
                { t: 'Roof Rack — Install PDF',   sub: '14 pages · 22 MB', icon: <I.external size={14}/> },
                { t: 'Grille Swap — Install PDF', sub: '8 pages · 9 MB',   icon: <I.external size={14}/> },
                { t: 'Roof Rack — Install Video', sub: '12 min · YouTube', icon: <I.external size={14}/> },
                { t: 'Torque Spec Sheet',         sub: '1 page · 320 KB',  icon: <I.external size={14}/> },
              ].map((r, i) => (
                <a key={i} href="#" onClick={(e) => { e.preventDefault(); onNav('install-guide'); }} style={{
                  padding: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  borderRight: !mobile && i % 2 === 0 ? '1px solid var(--c-border)' : 0,
                  borderTop: i >= 2 || mobile && i > 0 ? '1px solid var(--c-border)' : 0,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.t}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.08em', marginTop: 2 }}>{r.sub}</div>
                  </div>
                  <span style={{ color: 'var(--c-muted)' }}>{r.icon}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <DetailBox title="SHIPPING TO">
            <strong>Mike Rodriguez</strong><br/>
            2418 W Cactus Rd<br/>
            Phoenix, AZ 85029<br/>
            (602) 555-0188
          </DetailBox>
          <DetailBox title="SHIPPING METHOD">
            <strong>Standard Ground · FREE</strong><br/>
            <span style={{ color: 'var(--c-muted)' }}>FedEx · Carbon-neutral</span>
          </DetailBox>
          <DetailBox title="PAYMENT">
            <span className="mono" style={{ letterSpacing: '0.08em' }}>VISA •••• 4242</span><br/>
            <span style={{ color: 'var(--c-muted)' }}>Charged ${total.toFixed(2)}</span>
          </DetailBox>

          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
            <Row label="Shipping" value="FREE" success />
            <Row label="Tax" value={`$${tax.toFixed(2)}`} muted />
            <div style={{ height: 1, background: 'var(--c-border)', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', fontWeight: 600 }}>TOTAL</span>
              <span className="mono" style={{ fontSize: 20, fontWeight: 700 }}>${total.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 16 }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.14em', marginBottom: 10 }}>NEED HELP?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={() => onNav('returns')} className="btn btn-sm btn-block" style={{ justifyContent: 'space-between' }}>START A RETURN <I.return size={12} /></button>
              <button onClick={() => onNav('contact')} className="btn btn-sm btn-block" style={{ justifyContent: 'space-between' }}>CONTACT SUPPORT <I.chat size={12} /></button>
              <button className="btn btn-sm btn-block" style={{ justifyContent: 'space-between' }}>REPORT ISSUE <I.alert size={12} /></button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, sub, highlight }) {
  return (
    <div style={{ padding: 18, borderRight: '1px solid var(--c-border)', position: 'relative' }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: highlight ? 'var(--c-accent)' : 'var(--c-muted)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em', marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function DetailBox({ title, children }) {
  return (
    <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 16 }}>
      <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.14em', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function Row({ label, value, success, muted }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: muted ? 'var(--c-muted)' : 'var(--c-text)' }}>{label}</span>
      <span className="mono" style={{ color: success ? 'var(--c-success)' : 'var(--c-text)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

window.OrderDetailPage = OrderDetailPage;
