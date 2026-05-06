// ============================================================
// Stehlen Auto — Checkout (stepped)
// ============================================================
const { I, Logo } = window.STEHLEN_UI;

function CheckoutPage({ onNav, mobile, vehicle }) {
  const { CART_LINES } = window.STEHLEN_DATA;
  const [step, setStep] = useState(1); // 1 = info, 2 = shipping, 3 = payment, 4 = review
  const [email, setEmail] = useState('mike.rodriguez@example.com');
  const [shipMethod, setShipMethod] = useState('standard');
  const [payMethod, setPayMethod] = useState('card');

  const subtotal = CART_LINES.reduce((s, l) => s + l.price * l.qty, 0);
  const shipping = shipMethod === 'express' ? 24.95 : (shipMethod === 'overnight' ? 49.95 : 0);
  const tax = subtotal * 0.0875;
  const total = subtotal + shipping + tax;

  const steps = ['INFORMATION', 'SHIPPING', 'PAYMENT', 'REVIEW'];

  return (
    <div style={{ background: 'var(--c-bg)', minHeight: '100vh' }}>
      {/* Custom checkout header — replaces normal site chrome feel */}
      <div style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); onNav('cart'); }} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Logo height={24} />
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--c-muted)', fontSize: 12 }}>
            <I.shield size={14} stroke="var(--c-success)" />
            <span className="mono" style={{ letterSpacing: '0.1em' }}>SECURE CHECKOUT · 256-BIT SSL</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: mobile ? '24px 0' : '48px 0' }}>
        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32, overflowX: 'auto' }} className="no-scrollbar">
          {steps.map((s, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            return (
              <React.Fragment key={s}>
                <button onClick={() => done && setStep(n)} disabled={!done && !active} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', background: 'transparent', border: 0,
                  color: active ? 'var(--c-text)' : (done ? 'var(--c-success)' : 'var(--c-muted-2)'),
                  cursor: done ? 'pointer' : 'default',
                  whiteSpace: 'nowrap',
                }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: done ? 'var(--c-success)' : (active ? 'var(--c-accent)' : 'transparent'),
                    border: !done && !active ? '1px solid var(--c-border-2)' : '0',
                    color: done ? 'var(--c-bg)' : (active ? 'var(--c-bg)' : 'var(--c-muted-2)'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--f-display)', fontSize: 11, fontWeight: 700,
                  }}>{done ? <I.check size={12} stroke="var(--c-bg)" sw={3}/> : n}</span>
                  <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', fontWeight: active ? 600 : 500 }}>{s}</span>
                </button>
                {i < steps.length - 1 && <div style={{ flex: 1, minWidth: 20, height: 1, background: done ? 'var(--c-success)' : 'var(--c-border)' }} />}
              </React.Fragment>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 380px', gap: 32 }}>
          {/* LEFT — form panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* STEP 1: INFO */}
            <Panel title="01 · CONTACT" status={step > 1 ? 'done' : (step === 1 ? 'active' : 'pending')} onEdit={() => setStep(1)}>
              {step === 1 ? (
                <>
                  <div className="label-eyebrow">EMAIL</div>
                  <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ marginBottom: 12 }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--c-muted)' }}>
                    <input type="checkbox" defaultChecked /> Email me with deals and install guides
                  </label>
                  <div className="label-eyebrow" style={{ marginTop: 24 }}>SHIPPING ADDRESS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <input className="input" placeholder="First name" defaultValue="Mike" />
                    <input className="input" placeholder="Last name" defaultValue="Rodriguez" />
                  </div>
                  <input className="input" placeholder="Address" defaultValue="2418 W Cactus Rd" style={{ marginBottom: 8 }} />
                  <input className="input" placeholder="Apt, Suite, etc. (optional)" style={{ marginBottom: 8 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <input className="input" placeholder="City" defaultValue="Phoenix" />
                    <select className="select"><option>AZ</option><option>CA</option><option>NV</option><option>TX</option></select>
                    <input className="input" placeholder="ZIP" defaultValue="85029" />
                  </div>
                  <input className="input" placeholder="Phone" defaultValue="(602) 555-0188" />
                  <button onClick={() => setStep(2)} className="btn btn-primary btn-lg btn-block" style={{ marginTop: 20 }}>CONTINUE TO SHIPPING →</button>
                </>
              ) : (
                <Summary lines={[
                  ['Email', email],
                  ['Address', 'Mike Rodriguez · 2418 W Cactus Rd · Phoenix, AZ 85029'],
                  ['Phone', '(602) 555-0188'],
                ]} />
              )}
            </Panel>

            {/* STEP 2: SHIPPING */}
            <Panel title="02 · SHIPPING METHOD" status={step > 2 ? 'done' : (step === 2 ? 'active' : 'pending')} onEdit={() => setStep(2)}>
              {step >= 2 ? (
                step === 2 ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { id: 'standard', name: 'Standard Ground', eta: '4–6 business days', price: 0, badge: 'FREE on $99+' },
                        { id: 'express', name: 'FedEx 2-Day', eta: '2 business days', price: 24.95 },
                        { id: 'overnight', name: 'FedEx Overnight', eta: 'Next business day', price: 49.95 },
                      ].map(s => (
                        <label key={s.id} style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: 16,
                          background: shipMethod === s.id ? 'var(--c-surface-2)' : 'var(--c-surface)',
                          border: `1px solid ${shipMethod === s.id ? 'var(--c-accent)' : 'var(--c-border)'}`,
                          borderRadius: 'var(--r-md)', cursor: 'pointer',
                        }}>
                          <input type="radio" checked={shipMethod === s.id} onChange={() => setShipMethod(s.id)} style={{ accentColor: 'var(--c-accent)' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>{s.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{s.eta}{s.badge && <span className="mono" style={{ marginLeft: 8, color: 'var(--c-accent)', fontSize: 10, letterSpacing: '0.08em' }}>{s.badge}</span>}</div>
                          </div>
                          <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{s.price === 0 ? 'FREE' : `$${s.price.toFixed(2)}`}</span>
                        </label>
                      ))}
                    </div>
                    <button onClick={() => setStep(3)} className="btn btn-primary btn-lg btn-block" style={{ marginTop: 20 }}>CONTINUE TO PAYMENT →</button>
                  </>
                ) : <Summary lines={[['Method', shipMethod === 'standard' ? 'Standard Ground · FREE' : (shipMethod === 'express' ? 'FedEx 2-Day · $24.95' : 'FedEx Overnight · $49.95')]]} />
              ) : <Locked />}
            </Panel>

            {/* STEP 3: PAYMENT */}
            <Panel title="03 · PAYMENT" status={step > 3 ? 'done' : (step === 3 ? 'active' : 'pending')} onEdit={() => setStep(3)}>
              {step >= 3 ? (
                step === 3 ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 16 }}>
                      {[['card','CARD'],['paypal','PAYPAL'],['affirm','AFFIRM'],['shop','SHOP PAY']].map(([id, l]) => (
                        <button key={id} onClick={() => setPayMethod(id)} className="btn btn-sm" style={{
                          background: payMethod === id ? 'var(--c-text)' : 'transparent',
                          color: payMethod === id ? 'var(--c-bg)' : 'var(--c-text)',
                          borderColor: payMethod === id ? 'var(--c-text)' : 'var(--c-border)',
                          height: 44,
                        }}>{l}</button>
                      ))}
                    </div>
                    {payMethod === 'card' && (
                      <>
                        <div className="label-eyebrow">CARD NUMBER</div>
                        <input className="input" placeholder="1234 5678 9012 3456" defaultValue="•••• •••• •••• 4242" style={{ marginBottom: 8, fontFamily: 'var(--f-display)' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                          <input className="input" placeholder="MM / YY" defaultValue="08 / 27" style={{ fontFamily: 'var(--f-display)' }} />
                          <input className="input" placeholder="CVC" defaultValue="•••" style={{ fontFamily: 'var(--f-display)' }} />
                          <input className="input" placeholder="ZIP" defaultValue="85029" style={{ fontFamily: 'var(--f-display)' }} />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--c-muted)' }}>
                          <input type="checkbox" defaultChecked /> Use as billing address
                        </label>
                      </>
                    )}
                    {payMethod === 'affirm' && (
                      <div style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', padding: 16, borderRadius: 'var(--r-md)' }}>
                        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--c-accent)', marginBottom: 6 }}>4 PAYMENTS</div>
                        <div style={{ fontSize: 18, fontWeight: 600 }}>${(total/4).toFixed(2)}/mo for 4 months</div>
                        <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 4 }}>0% APR. No fees, no surprises. Subject to eligibility.</div>
                      </div>
                    )}
                    <button onClick={() => setStep(4)} className="btn btn-primary btn-lg btn-block" style={{ marginTop: 20 }}>REVIEW ORDER →</button>
                  </>
                ) : <Summary lines={[['Method', payMethod === 'card' ? 'Visa •••• 4242' : payMethod.toUpperCase()]]} />
              ) : <Locked />}
            </Panel>

            {/* STEP 4: REVIEW */}
            <Panel title="04 · REVIEW & PLACE ORDER" status={step === 4 ? 'active' : 'pending'}>
              {step === 4 ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {CART_LINES.map(l => (
                      <div key={l.sku} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, background: 'var(--c-surface-2)', borderRadius: 'var(--r-sm)' }}>
                        <div className="product-img-bg" style={{ width: 56, height: 56, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <img src={l.image} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{l.title}</div>
                          <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.08em' }}>{l.subtitle} · QTY {l.qty}</div>
                        </div>
                        <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>${(l.price * l.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => onNav('order-confirmation')} className="btn btn-primary btn-lg btn-block" style={{ marginTop: 24, height: 64, fontSize: 15 }}>
                    PLACE ORDER · ${total.toFixed(2)}
                  </button>
                  <div style={{ fontSize: 11, color: 'var(--c-muted)', textAlign: 'center', marginTop: 12 }}>
                    By placing your order you agree to Stehlen's <a href="#" style={{ color: 'var(--c-text)', textDecoration: 'underline' }}>Terms</a> and <a href="#" style={{ color: 'var(--c-text)', textDecoration: 'underline' }}>Privacy Policy</a>.
                  </div>
                </>
              ) : <Locked />}
            </Panel>
          </div>

          {/* RIGHT — order summary */}
          <div style={{ position: mobile ? 'static' : 'sticky', top: 88, alignSelf: 'start' }}>
            <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>
                <span className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', fontWeight: 600 }}>ORDER ({CART_LINES.length})</span>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, borderBottom: '1px solid var(--c-border)' }}>
                {CART_LINES.map(l => (
                  <div key={l.sku} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div className="product-img-bg" style={{ width: 56, height: 56, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={l.image} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                      </div>
                      <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, padding: '0 6px', borderRadius: 10, background: 'var(--c-accent)', color: 'var(--c-bg)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--f-display)' }}>{l.qty}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                      <div className="mono" style={{ fontSize: 9, color: 'var(--c-muted)', letterSpacing: '0.08em' }}>{l.subtitle}</div>
                    </div>
                    <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>${(l.price * l.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
                <Row label="Shipping" value={shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`} success={shipping === 0} />
                <Row label="Tax" value={`$${tax.toFixed(2)}`} muted />
              </div>
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', fontWeight: 600 }}>TOTAL</span>
                <span className="mono" style={{ fontSize: 22, fontWeight: 700 }}>${total.toFixed(2)}</span>
              </div>
            </div>

            {vehicle && (
              <div style={{ marginTop: 12, padding: 14, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--r-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <I.check size={12} stroke="var(--c-success)" />
                  <span className="mono" style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--c-success)' }}>FITMENT VERIFIED</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>All items fit your {vehicle.year} {vehicle.make} {vehicle.model}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, status, children, onEdit }) {
  const active = status === 'active', done = status === 'done', pending = status === 'pending';
  return (
    <div style={{
      background: 'var(--c-surface)',
      border: `1px solid ${active ? 'var(--c-accent)' : 'var(--c-border)'}`,
      borderRadius: 'var(--r-md)',
      opacity: pending ? 0.55 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: active || done ? '1px solid var(--c-border)' : '0' }}>
        <span className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', fontWeight: 600 }}>{title}</span>
        {done && <button onClick={onEdit} style={{ background: 'transparent', border: 0, color: 'var(--c-muted)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>EDIT</button>}
      </div>
      {(active || done) && <div style={{ padding: 20 }}>{children}</div>}
    </div>
  );
}

function Summary({ lines }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {lines.map(([k, v]) => (
        <div key={k} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, fontSize: 13 }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.1em' }}>{k.toUpperCase()}</span>
          <span>{v}</span>
        </div>
      ))}
    </div>
  );
}

function Locked() {
  return <div style={{ padding: 8, fontSize: 12, color: 'var(--c-muted-2)', fontStyle: 'italic' }}>Complete the previous step to continue.</div>;
}

function Row({ label, value, success, muted }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: muted ? 'var(--c-muted)' : 'var(--c-text)' }}>{label}</span>
      <span className="mono" style={{ color: success ? 'var(--c-success)' : 'var(--c-text)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

window.CheckoutPage = CheckoutPage;
