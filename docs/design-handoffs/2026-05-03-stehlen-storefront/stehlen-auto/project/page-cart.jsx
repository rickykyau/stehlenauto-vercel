// ============================================================
// Stehlen Auto — Full Cart Page
// ============================================================
const { I, Stars } = window.STEHLEN_UI;

function CartPage({ vehicle, onYMMOpen, onNav, mobile }) {
  const { CART_LINES, PRODUCTS } = window.STEHLEN_DATA;
  const [lines, setLines] = useState(CART_LINES);
  const [promo, setPromo] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const discount = promoApplied ? subtotal * 0.10 : 0;
  const shipping = subtotal >= 99 ? 0 : 12.95;
  const tax = (subtotal - discount) * 0.0875;
  const total = subtotal - discount + shipping + tax;

  const updateQty = (sku, q) => {
    if (q < 1) return setLines(lines.filter(l => l.sku !== sku));
    setLines(lines.map(l => l.sku === sku ? { ...l, qty: q } : l));
  };

  const recommended = PRODUCTS.slice(2, 6);

  return (
    <main>
      {/* Breadcrumb */}
      <div style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
        <div className="container" style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); onNav('home'); }} className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', letterSpacing: '0.08em' }}>HOME</a>
          <span className="mono" style={{ fontSize: 11, color: 'var(--c-muted-2)' }}>/</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--c-text)', letterSpacing: '0.08em', fontWeight: 600 }}>CART</span>
        </div>
      </div>

      <div className="container" style={{ padding: mobile ? '24px 0' : '48px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>YOUR CART · {lines.reduce((s,l)=>s+l.qty,0)} ITEMS</div>
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 36 : 56, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 0.95 }}>REVIEW<br/>YOUR ORDER.</h1>
          </div>
          {vehicle && (
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', padding: '10px 14px', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <I.check size={14} stroke="var(--c-success)" />
              <span className="mono" style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--c-success)' }}>ALL ITEMS FIT YOUR {vehicle.year} {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 380px', gap: 32 }}>
          {/* LEFT — line items */}
          <div>
            {/* Progress to free shipping */}
            <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span className="mono" style={{ fontSize: 11, letterSpacing: '0.1em' }}>
                  {subtotal >= 99 ? <span style={{ color: 'var(--c-success)' }}>✓ FREE SHIPPING UNLOCKED</span> : <>${(99 - subtotal).toFixed(2)} AWAY FROM FREE SHIPPING</>}
                </span>
                <I.shipping size={16} stroke={subtotal >= 99 ? 'var(--c-success)' : 'var(--c-muted)'} />
              </div>
              <div style={{ height: 4, background: 'var(--c-bg)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (subtotal/99)*100)}%`, background: subtotal >= 99 ? 'var(--c-success)' : 'var(--c-accent)', transition: 'width 200ms ease' }} />
              </div>
            </div>

            {/* Header row */}
            <div style={{ display: mobile ? 'none' : 'grid', gridTemplateColumns: '1fr 100px 80px 80px 32px', gap: 16, padding: '12px 16px', borderBottom: '1px solid var(--c-border)' }}>
              {['ITEM','QTY','PRICE','TOTAL',''].map((h,i)=>(
                <div key={i} className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--c-muted)', textAlign: i >= 2 && i < 4 ? 'right' : 'left' }}>{h}</div>
              ))}
            </div>

            {/* Lines */}
            {lines.map(l => (
              <div key={l.sku} style={{
                display: 'grid',
                gridTemplateColumns: mobile ? '80px 1fr' : '1fr 100px 80px 80px 32px',
                gap: 16,
                padding: '20px 16px',
                borderBottom: '1px solid var(--c-border)',
                alignItems: 'center',
              }}>
                {mobile ? (
                  <>
                    <div className="product-img-bg" style={{ width: 80, height: 80, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={l.image} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{l.title}</div>
                      <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.08em', marginBottom: 6 }}>{l.subtitle}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <I.check size={11} stroke="var(--c-success)" />
                        <span className="mono" style={{ fontSize: 10, color: 'var(--c-success)', letterSpacing: '0.08em' }}>FITS {l.fitFor.toUpperCase()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'inline-flex', border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)' }}>
                          <button onClick={() => updateQty(l.sku, l.qty-1)} style={{ width: 28, height: 28, background: 'transparent', border: 0, color: 'var(--c-text)', cursor: 'pointer' }}><I.minus size={11}/></button>
                          <span className="mono" style={{ width: 24, textAlign: 'center', fontSize: 12, lineHeight: '28px' }}>{l.qty}</span>
                          <button onClick={() => updateQty(l.sku, l.qty+1)} style={{ width: 28, height: 28, background: 'transparent', border: 0, color: 'var(--c-text)', cursor: 'pointer' }}><I.plus size={11}/></button>
                        </div>
                        <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>${(l.price * l.qty).toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div className="product-img-bg" style={{ width: 96, height: 96, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <img src={l.image} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                      </div>
                      <div>
                        <a href="#" onClick={(e) => { e.preventDefault(); onNav('pdp'); }} style={{ fontSize: 15, fontWeight: 500, marginBottom: 4, display: 'block' }}>{l.title}</a>
                        <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.08em', marginBottom: 6 }}>SKU {l.sku} · {l.subtitle}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <I.check size={12} stroke="var(--c-success)" />
                          <span className="mono" style={{ fontSize: 10, color: 'var(--c-success)', letterSpacing: '0.08em' }}>FITS {l.fitFor.toUpperCase()}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 14 }}>
                          <button style={{ background: 'transparent', border: 0, color: 'var(--c-muted)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Save for later</button>
                          <button onClick={() => updateQty(l.sku, 0)} style={{ background: 'transparent', border: 0, color: 'var(--c-muted)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Remove</button>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'inline-flex', border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)', justifySelf: 'start' }}>
                      <button onClick={() => updateQty(l.sku, l.qty-1)} style={{ width: 32, height: 32, background: 'transparent', border: 0, color: 'var(--c-text)', cursor: 'pointer' }}><I.minus size={12}/></button>
                      <span className="mono" style={{ width: 32, textAlign: 'center', fontSize: 13, lineHeight: '32px' }}>{l.qty}</span>
                      <button onClick={() => updateQty(l.sku, l.qty+1)} style={{ width: 32, height: 32, background: 'transparent', border: 0, color: 'var(--c-text)', cursor: 'pointer' }}><I.plus size={12}/></button>
                    </div>
                    <div className="mono" style={{ fontSize: 14, textAlign: 'right' }}>${l.price.toFixed(2)}</div>
                    <div className="mono" style={{ fontSize: 14, fontWeight: 700, textAlign: 'right' }}>${(l.price * l.qty).toFixed(2)}</div>
                    <button onClick={() => updateQty(l.sku, 0)} style={{ background: 'transparent', border: 0, color: 'var(--c-muted)', cursor: 'pointer', display: 'flex', justifyContent: 'flex-end' }}><I.trash size={14} /></button>
                  </>
                )}
              </div>
            ))}

            {/* Continue shopping */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, flexWrap: 'wrap', gap: 12 }}>
              <button onClick={() => onNav('home')} className="btn">
                <I.chevLeft size={12} /> CONTINUE SHOPPING
              </button>
              <span className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', letterSpacing: '0.08em' }}>SUBTOTAL · ${subtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* RIGHT — sticky summary */}
          <div style={{ position: mobile ? 'static' : 'sticky', top: 160, alignSelf: 'start' }}>
            <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>
                <span className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', fontWeight: 600 }}>ORDER SUMMARY</span>
              </div>

              {/* Promo */}
              <div style={{ padding: 20, borderBottom: '1px solid var(--c-border)' }}>
                <div className="label-eyebrow" style={{ marginBottom: 6 }}>PROMO CODE</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={promo} onChange={(e) => setPromo(e.target.value)} className="input" placeholder="Enter code" style={{ height: 40, flex: 1, fontSize: 13 }} />
                  <button onClick={() => promo && setPromoApplied(true)} className="btn btn-sm" style={{ height: 40 }}>APPLY</button>
                </div>
                {promoApplied && (
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--c-success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <I.check size={11} /> 10% off applied
                  </div>
                )}
              </div>

              {/* Lines */}
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
                {discount > 0 && <Row label="Promo" value={`-$${discount.toFixed(2)}`} success />}
                <Row label="Shipping" value={shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`} success={shipping === 0} />
                <Row label="Tax (est.)" value={`$${tax.toFixed(2)}`} muted />
              </div>

              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', fontWeight: 600 }}>TOTAL</span>
                <span className="mono" style={{ fontSize: 24, fontWeight: 700 }}>${total.toFixed(2)}</span>
              </div>

              <div style={{ padding: 20, borderTop: '1px solid var(--c-border)' }}>
                <button onClick={() => onNav('checkout')} className="btn btn-primary btn-block btn-lg">CHECKOUT · ${total.toFixed(2)}</button>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button className="btn btn-block" style={{ background: '#000', color: '#fff', borderColor: '#000', fontWeight: 600 }}>  Pay</button>
                  <button className="btn btn-block" style={{ background: '#5a31f4', color: '#fff', borderColor: '#5a31f4' }}>Shop Pay</button>
                </div>
                <div style={{ marginTop: 14, fontSize: 11, color: 'var(--c-muted)', textAlign: 'center' }}>or 4 payments of ${(total/4).toFixed(2)} with <strong style={{ color: 'var(--c-text)' }}>Affirm</strong></div>
              </div>
            </div>

            {/* Trust micro */}
            <div style={{ marginTop: 12, padding: 16, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { i: <I.shield size={14}/>, t: 'Lifetime structural warranty' },
                { i: <I.return size={14}/>, t: '30-day hassle-free returns' },
                { i: <I.shipping size={14}/>, t: 'Ships from CA, NV, TX warehouses' },
              ].map((it, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--c-muted)' }}>
                  <span style={{ color: 'var(--c-accent)' }}>{it.i}</span>{it.t}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommended */}
        <section style={{ marginTop: 64 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>FREQUENTLY BOUGHT TOGETHER</div>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 24 : 28, textTransform: 'uppercase', marginBottom: 20 }}>FINISH THE BUILD.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16 }}>
            {recommended.map(p => <window.ProductCard key={p.sku} product={p} density="standard" onOpen={() => onNav('pdp')} vehicle={vehicle} />)}
          </div>
        </section>
      </div>
    </main>
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

window.CartPage = CartPage;
