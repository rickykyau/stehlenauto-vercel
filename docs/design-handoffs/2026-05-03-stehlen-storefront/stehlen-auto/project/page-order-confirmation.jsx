// ============================================================
// Stehlen Auto — Order Confirmation
// ============================================================
const { I, Logo } = window.STEHLEN_UI;

function OrderConfirmationPage({ onNav, mobile }) {
  const { CART_LINES } = window.STEHLEN_DATA;
  const orderNum = 'STH-284-9817';
  const subtotal = CART_LINES.reduce((s, l) => s + l.price * l.qty, 0);
  const tax = subtotal * 0.0875;
  const total = subtotal + tax;

  return (
    <main>
      {/* HERO BAND */}
      <div style={{
        background: 'linear-gradient(180deg, var(--c-surface) 0%, var(--c-bg) 100%)',
        borderBottom: '1px solid var(--c-border)',
      }}>
        <div className="container" style={{ padding: mobile ? '40px 0 56px' : '72px 0 80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--c-success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 8px rgba(34,197,94,0.15)',
            }}>
              <I.check size={28} stroke="var(--c-bg)" sw={3} />
            </div>
            <div>
              <div className="eyebrow" style={{ color: 'var(--c-success)', marginBottom: 4 }}>ORDER PLACED · THANK YOU</div>
              <div className="mono" style={{ fontSize: 13, color: 'var(--c-muted)', letterSpacing: '0.1em' }}>ORDER #{orderNum}</div>
            </div>
          </div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 40 : 72, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 0.95 }}>
            BUILD'S<br/>ON ITS WAY.
          </h1>
          <p style={{ marginTop: 16, color: 'var(--c-muted)', fontSize: 15, maxWidth: 580 }}>
            Confirmation sent to <strong style={{ color: 'var(--c-text)' }}>mike.rodriguez@example.com</strong>. Tracking lands in your inbox once your order ships — usually within 24 hours.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
            <button onClick={() => onNav('account')} className="btn btn-primary">VIEW ORDER STATUS</button>
            <button onClick={() => onNav('home')} className="btn">CONTINUE SHOPPING</button>
          </div>
        </div>
      </div>

      {/* TIMELINE */}
      <div className="container" style={{ padding: mobile ? '32px 0' : '56px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 20 }}>ORDER STATUS</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: mobile ? '1fr' : 'repeat(4, 1fr)',
          gap: mobile ? 16 : 0,
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          borderRadius: 'var(--r-md)',
          overflow: 'hidden',
        }}>
          {[
            { label: 'ORDER PLACED',    sub: 'Today · 2:14 PM PST',      done: true,  current: false },
            { label: 'PROCESSING',      sub: 'Within 24 hours',          done: false, current: true },
            { label: 'SHIPPED',         sub: 'Est. tomorrow',            done: false, current: false },
            { label: 'DELIVERED',       sub: 'Est. 4–6 business days',   done: false, current: false },
          ].map((s, i, arr) => (
            <div key={i} style={{
              padding: 20,
              borderRight: !mobile && i < arr.length - 1 ? '1px solid var(--c-border)' : 0,
              borderBottom: mobile && i < arr.length - 1 ? '1px solid var(--c-border)' : 0,
              background: s.current ? 'var(--c-surface-2)' : 'transparent',
              position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: s.done ? 'var(--c-success)' : (s.current ? 'var(--c-accent)' : 'transparent'),
                  border: !s.done && !s.current ? '1px solid var(--c-border-2)' : 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--f-display)', fontSize: 10, fontWeight: 700,
                  color: s.done || s.current ? 'var(--c-bg)' : 'var(--c-muted-2)',
                }}>{s.done ? <I.check size={11} stroke="var(--c-bg)" sw={3}/> : i+1}</span>
                <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', fontWeight: s.current ? 700 : 500, color: s.current || s.done ? 'var(--c-text)' : 'var(--c-muted-2)' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)', paddingLeft: 32 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TWO-COLUMN: ITEMS + DETAILS */}
      <div className="container" style={{ padding: '0 0 56px', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 380px', gap: 32 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>ITEMS · {CART_LINES.length}</div>
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            {CART_LINES.map((l, i) => (
              <div key={l.sku} style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr auto',
                gap: 16, padding: 16, alignItems: 'center',
                borderBottom: i < CART_LINES.length - 1 ? '1px solid var(--c-border)' : 0,
              }}>
                <div className="product-img-bg" style={{ width: 80, height: 80, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>${(l.price * l.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Install help band */}
          <div style={{
            marginTop: 20,
            background: 'var(--c-accent)', color: 'var(--c-accent-ink)',
            borderRadius: 'var(--r-md)',
            padding: mobile ? 20 : 28,
            display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr auto', gap: 16, alignItems: 'center',
          }}>
            <div>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 700, marginBottom: 6 }}>INSTALL HELP</div>
              <h3 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 22 : 28, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>NEED A HAND BOLTING IT ON?</h3>
              <p style={{ fontSize: 13, marginTop: 6, opacity: 0.85 }}>Step-by-step PDFs ship with every order. Or call our techs Mon–Fri 9–5 PST.</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" style={{ background: 'transparent', borderColor: 'rgba(0,0,0,0.3)', color: 'var(--c-accent-ink)' }}>GUIDES</button>
              <button className="btn" style={{ background: 'var(--c-bg)', borderColor: 'var(--c-bg)', color: 'var(--c-text)' }}>1-888-378-4536</button>
            </div>
          </div>
        </div>

        {/* RIGHT — details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <DetailBox title="SHIPPING TO">
            <strong>Mike Rodriguez</strong><br/>
            2418 W Cactus Rd<br/>
            Phoenix, AZ 85029<br/>
            (602) 555-0188
          </DetailBox>
          <DetailBox title="SHIPPING METHOD">
            <strong>Standard Ground · FREE</strong><br/>
            <span style={{ color: 'var(--c-muted)' }}>Estimated delivery: 4–6 business days</span>
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
        </div>
      </div>
    </main>
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

window.OrderConfirmationPage = OrderConfirmationPage;
