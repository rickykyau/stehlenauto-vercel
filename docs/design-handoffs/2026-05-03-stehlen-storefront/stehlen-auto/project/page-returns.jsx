// ============================================================
// Stehlen Auto — Returns Flow (multi-step)
// ============================================================
const { I, Logo } = window.STEHLEN_UI;

function ReturnsPage({ onNav, mobile }) {
  const { CART_LINES } = window.STEHLEN_DATA;
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState({}); // sku -> qty
  const [reasons, setReasons] = useState({}); // sku -> reason
  const [resolution, setResolution] = useState('refund');
  const [notes, setNotes] = useState('');

  const orderNum = 'STH-281-4422';
  const steps = ['ITEMS', 'REASON', 'RESOLUTION', 'LABEL'];

  const REASONS = [
    'Doesn\'t fit my vehicle',
    'Arrived damaged',
    'Wrong item shipped',
    'Changed my mind',
    'Quality not as expected',
    'Found a better price',
    'Other',
  ];

  const selectedLines = CART_LINES.filter(l => selected[l.sku] > 0);
  const refundTotal = selectedLines.reduce((s, l) => s + l.price * (selected[l.sku] || 0), 0);
  const canContinueStep1 = selectedLines.length > 0;
  const canContinueStep2 = selectedLines.every(l => reasons[l.sku]);

  return (
    <main>
      {/* MINI HEADER (mirrors checkout chrome) */}
      <div style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
        <div className="container" style={{ padding: '14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="#" onClick={(e) => { e.preventDefault(); onNav('order-detail'); }} className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', letterSpacing: '0.1em', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <I.chevLeft size={11} /> BACK TO ORDER
            </a>
            <span className="mono" style={{ fontSize: 11, color: 'var(--c-muted-2)', letterSpacing: '0.1em' }}>·</span>
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.1em' }}>RETURN FROM ORDER #{orderNum}</span>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--c-muted)', fontSize: 12 }}>
            <I.shield size={12} stroke="var(--c-success)" /> 30-DAY RETURN WINDOW · 18 DAYS LEFT
          </span>
        </div>
      </div>

      <div className="container" style={{ padding: mobile ? '24px 0' : '40px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>RETURNS</div>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 36 : 56, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 0.95, marginBottom: 28 }}>
          {step < 4 ? 'START A RETURN' : 'YOU\'RE ALL SET.'}
        </h1>

        {/* STEPPER */}
        {step < 4 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28, overflowX: 'auto' }} className="no-scrollbar">
            {steps.slice(0, 3).map((s, i) => {
              const n = i + 1;
              const done = n < step;
              const active = n === step;
              return (
                <React.Fragment key={s}>
                  <button onClick={() => done && setStep(n)} disabled={!done && !active} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 14px 8px 0', background: 'transparent', border: 0,
                    color: active ? 'var(--c-text)' : (done ? 'var(--c-success)' : 'var(--c-muted-2)'),
                    cursor: done ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                  }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: done ? 'var(--c-success)' : (active ? 'var(--c-accent)' : 'transparent'),
                      border: !done && !active ? '1px solid var(--c-border-2)' : 0,
                      color: done || active ? 'var(--c-bg)' : 'var(--c-muted-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--f-display)', fontSize: 11, fontWeight: 700,
                    }}>{done ? <I.check size={12} stroke="var(--c-bg)" sw={3}/> : n}</span>
                    <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', fontWeight: active ? 600 : 500 }}>{s}</span>
                  </button>
                  {i < 2 && <div style={{ flex: 1, minWidth: 30, height: 1, background: done ? 'var(--c-success)' : 'var(--c-border)', marginRight: 14 }} />}
                </React.Fragment>
              );
            })}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : (step === 4 ? '1fr' : '1fr 360px'), gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* STEP 1: PICK ITEMS */}
            {step === 1 && (
              <>
                <p style={{ color: 'var(--c-muted)', fontSize: 14, marginTop: 0, marginBottom: 8 }}>Select the items you'd like to return. You can return part of an order.</p>
                <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                  {CART_LINES.map((l, i) => {
                    const qty = selected[l.sku] || 0;
                    const checked = qty > 0;
                    return (
                      <div key={l.sku} style={{
                        display: 'grid', gridTemplateColumns: mobile ? '24px 64px 1fr' : '24px 80px 1fr auto auto', gap: 16, padding: 16, alignItems: 'center',
                        borderBottom: i < CART_LINES.length - 1 ? '1px solid var(--c-border)' : 0,
                        background: checked ? 'rgba(245,168,35,0.04)' : 'transparent',
                      }}>
                        <input type="checkbox" checked={checked} onChange={(e) => setSelected(s => ({ ...s, [l.sku]: e.target.checked ? l.qty : 0 }))} style={{ accentColor: 'var(--c-accent)' }} />
                        <div className="product-img-bg" style={{ width: mobile ? 64 : 80, height: mobile ? 64 : 80, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={l.image} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{l.title}</div>
                          <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.08em', marginTop: 4 }}>SKU {l.sku} · ${l.price.toFixed(2)} · ORIGINAL QTY {l.qty}</div>
                        </div>
                        {!mobile && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)' }}>
                            <button disabled={!checked || qty <= 1} onClick={() => setSelected(s => ({ ...s, [l.sku]: Math.max(1, qty - 1) }))} style={{ width: 30, height: 30, background: 'transparent', border: 0, color: 'var(--c-text)', cursor: checked ? 'pointer' : 'default', opacity: checked ? 1 : 0.4 }}><I.minus size={11} /></button>
                            <span className="mono" style={{ fontSize: 12, padding: '0 12px' }}>{qty}</span>
                            <button disabled={!checked || qty >= l.qty} onClick={() => setSelected(s => ({ ...s, [l.sku]: Math.min(l.qty, qty + 1) }))} style={{ width: 30, height: 30, background: 'transparent', border: 0, color: 'var(--c-text)', cursor: checked ? 'pointer' : 'default', opacity: checked ? 1 : 0.4 }}><I.plus size={11} /></button>
                          </div>
                        )}
                        {!mobile && <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>${(l.price * qty).toFixed(2)}</span>}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={() => onNav('order-detail')} className="btn">CANCEL</button>
                  <button onClick={() => setStep(2)} disabled={!canContinueStep1} className="btn btn-primary" style={{ flex: 1 }}>CONTINUE → REASON</button>
                </div>
              </>
            )}

            {/* STEP 2: REASON */}
            {step === 2 && (
              <>
                <p style={{ color: 'var(--c-muted)', fontSize: 14, marginTop: 0, marginBottom: 8 }}>Tell us what's up with each item. We use this to keep our fitment data sharp.</p>
                {selectedLines.map(l => (
                  <div key={l.sku} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 14, padding: 16, borderBottom: '1px solid var(--c-border)', alignItems: 'center' }}>
                      <div className="product-img-bg" style={{ width: 64, height: 64, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={l.image} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{l.title}</div>
                        <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.08em', marginTop: 2 }}>QTY {selected[l.sku]} · ${(l.price * selected[l.sku]).toFixed(2)}</div>
                      </div>
                    </div>
                    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 8 }}>
                      {REASONS.map(r => {
                        const sel = reasons[l.sku] === r;
                        return (
                          <button key={r} onClick={() => setReasons(rr => ({ ...rr, [l.sku]: r }))} style={{
                            textAlign: 'left',
                            padding: '12px 14px',
                            background: sel ? 'var(--c-surface-2)' : 'transparent',
                            border: `1px solid ${sel ? 'var(--c-accent)' : 'var(--c-border)'}`,
                            borderRadius: 'var(--r-md)',
                            color: 'var(--c-text)',
                            fontSize: 13,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 10,
                          }}>
                            <span style={{
                              width: 14, height: 14, borderRadius: '50%',
                              border: `2px solid ${sel ? 'var(--c-accent)' : 'var(--c-border-2)'}`,
                              background: sel ? 'var(--c-accent)' : 'transparent',
                              flexShrink: 0,
                            }} />
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 16 }}>
                  <div className="label-eyebrow">ANYTHING ELSE WE SHOULD KNOW? (OPTIONAL)</div>
                  <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Photos help us escalate damaged-item claims faster…" rows={3} style={{ height: 'auto', padding: 12, resize: 'vertical', fontFamily: 'var(--f-body)', fontSize: 13, textTransform: 'none', letterSpacing: 0 }} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={() => setStep(1)} className="btn">← BACK</button>
                  <button onClick={() => setStep(3)} disabled={!canContinueStep2} className="btn btn-primary" style={{ flex: 1 }}>CONTINUE → RESOLUTION</button>
                </div>
              </>
            )}

            {/* STEP 3: RESOLUTION */}
            {step === 3 && (
              <>
                <p style={{ color: 'var(--c-muted)', fontSize: 14, marginTop: 0, marginBottom: 8 }}>How do you want this resolved?</p>
                {[
                  { id: 'refund',  t: 'Refund to original payment', s: 'Back on your VISA •••• 4242 in 3–5 business days after we receive the return.', extra: null },
                  { id: 'credit',  t: 'Store credit + 10% bonus', s: 'Get $' + (refundTotal * 1.1).toFixed(2) + ' in store credit, instantly. Use anywhere on stehlenauto.com.', extra: 'BONUS' },
                  { id: 'exchange',t: 'Exchange for a different fitment', s: 'We\'ll ship the replacement first, then issue your label. No charge.', extra: null },
                ].map(r => {
                  const sel = resolution === r.id;
                  return (
                    <button key={r.id} onClick={() => setResolution(r.id)} style={{
                      textAlign: 'left',
                      padding: 18,
                      background: sel ? 'var(--c-surface-2)' : 'var(--c-surface)',
                      border: `1px solid ${sel ? 'var(--c-accent)' : 'var(--c-border)'}`,
                      borderRadius: 'var(--r-md)',
                      color: 'var(--c-text)',
                      cursor: 'pointer',
                      display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 14, alignItems: 'flex-start',
                    }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: '50%',
                        border: `2px solid ${sel ? 'var(--c-accent)' : 'var(--c-border-2)'}`,
                        background: sel ? 'var(--c-accent)' : 'transparent',
                        marginTop: 2,
                      }} />
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{r.t}</div>
                        <div style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 4 }}>{r.s}</div>
                      </div>
                      {r.extra && <span className="badge badge-best">{r.extra}</span>}
                    </button>
                  );
                })}
                {/* Drop-off method */}
                <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 16, marginTop: 8 }}>
                  <div className="label-eyebrow">DROP-OFF METHOD</div>
                  <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 8, marginTop: 6 }}>
                    {['FedEx pickup at my address', 'I\'ll drop it at a FedEx location'].map((m, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', cursor: 'pointer', fontSize: 13 }}>
                        <input type="radio" name="dropoff" defaultChecked={i === 0} style={{ accentColor: 'var(--c-accent)' }} />
                        {m}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={() => setStep(2)} className="btn">← BACK</button>
                  <button onClick={() => setStep(4)} className="btn btn-primary" style={{ flex: 1 }}>SUBMIT RETURN <I.arrowR size={12} /></button>
                </div>
              </>
            )}

            {/* STEP 4: LABEL CONFIRMATION */}
            {step === 4 && (
              <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 24 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--c-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 8px rgba(34,197,94,0.15)' }}>
                      <I.check size={24} stroke="var(--c-bg)" sw={3} />
                    </div>
                    <div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--c-success)', letterSpacing: '0.12em' }}>RMA #STH-RMA-9302</div>
                      <div style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 2 }}>Confirmation sent to mike.rodriguez@example.com</div>
                    </div>
                  </div>
                  <p style={{ color: 'var(--c-muted)', fontSize: 14, lineHeight: 1.7 }}>
                    Your prepaid FedEx label is below. Pack the items in the original boxes if you've still got them — otherwise any sturdy box works. Stick the label on the outside.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 18 }}>
                    <button className="btn btn-primary btn-block" style={{ justifyContent: 'space-between' }}>DOWNLOAD LABEL (PDF) <I.external size={12} /></button>
                    <button className="btn btn-block" style={{ justifyContent: 'space-between' }}>EMAIL LABEL TO ME <I.arrowR size={12} /></button>
                    <button className="btn btn-block" style={{ justifyContent: 'space-between' }}>QR CODE FOR PHONE <I.arrowR size={12} /></button>
                  </div>

                  <div style={{ marginTop: 24, padding: 16, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)' }}>
                    <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 600, marginBottom: 10 }}>WHAT HAPPENS NEXT</div>
                    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        'Drop your package at any FedEx location within 14 days.',
                        'You\'ll get a tracking link as soon as the carrier scans it.',
                        'We inspect on arrival (1–2 days). Refund issued same day.',
                      ].map((t, i) => (
                        <li key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 12, fontSize: 13 }}>
                          <span className="mono" style={{ color: 'var(--c-accent)', fontWeight: 700 }}>{i + 1}.</span>
                          <span style={{ color: 'var(--c-muted)' }}>{t}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
                    <button onClick={() => onNav('account')} className="btn">VIEW IN ACCOUNT</button>
                    <button onClick={() => onNav('home')} className="btn">CONTINUE SHOPPING</button>
                  </div>
                </div>

                {/* Mock label */}
                <div style={{ background: '#fff', color: '#000', borderRadius: 'var(--r-md)', padding: 24, position: 'relative', fontFamily: 'var(--f-display)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: '0.12em', color: '#666' }}>STEHLEN AUTO RETURNS</div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>RMA STH-RMA-9302</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.04em' }}>FedEx</div>
                  </div>
                  <div style={{ fontSize: 10, letterSpacing: '0.14em', color: '#666' }}>SHIP FROM</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Mike Rodriguez<br/>2418 W Cactus Rd<br/>Phoenix, AZ 85029</div>
                  <div style={{ fontSize: 10, letterSpacing: '0.14em', color: '#666' }}>SHIP TO</div>
                  <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>STEHLEN AUTO — RETURNS<br/>1160 W RINCON ST, BAY 7<br/>CORONA, CA 92878</div>
                  {/* Barcode */}
                  <div style={{ marginTop: 16, height: 60, display: 'flex', gap: 1.5, alignItems: 'stretch' }}>
                    {Array.from({ length: 60 }).map((_, i) => (
                      <div key={i} style={{ flex: 1, background: i % 7 === 0 || i % 11 === 0 || i % 5 === 0 ? '#000' : (i % 3 === 0 ? '#000' : 'transparent'), width: i % 4 === 0 ? 3 : 1.5 }} />
                    ))}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 11, letterSpacing: '0.2em', marginTop: 6 }}>772 8451 0938 0044</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 10, letterSpacing: '0.1em', color: '#666', borderTop: '1px solid #ccc', paddingTop: 10 }}>
                    <span>WEIGHT 4.2 LB</span><span>GROUND</span><span>NO SIGNATURE</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — refund summary (steps 1–3) */}
          {step < 4 && !mobile && (
            <div style={{ alignSelf: 'flex-start', position: 'sticky', top: 88 }}>
              <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>
                  <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 600 }}>RETURNING ({selectedLines.length})</span>
                </div>
                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedLines.length === 0 && <div style={{ fontSize: 12, color: 'var(--c-muted-2)', fontStyle: 'italic', padding: 12 }}>No items selected.</div>}
                  {selectedLines.map(l => (
                    <div key={l.sku} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div className="product-img-bg" style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <img src={l.image} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                        <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.06em' }}>QTY {selected[l.sku]}</div>
                      </div>
                      <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>${(l.price * selected[l.sku]).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 14, borderTop: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--c-muted)' }}>
                    <span>Refund subtotal</span><span className="mono">${refundTotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--c-muted)' }}>
                    <span>Return shipping</span><span className="mono" style={{ color: 'var(--c-success)' }}>FREE</span>
                  </div>
                  {resolution === 'credit' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--c-accent)' }}>
                      <span>Store credit bonus (10%)</span><span className="mono">+${(refundTotal * 0.1).toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 8, marginTop: 4, borderTop: '1px solid var(--c-border)' }}>
                    <span className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', fontWeight: 600 }}>YOU'LL GET BACK</span>
                    <span className="mono" style={{ fontSize: 18, fontWeight: 700 }}>${(resolution === 'credit' ? refundTotal * 1.1 : refundTotal).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div style={{ padding: 14, marginTop: 12, background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <I.shield size={12} stroke="var(--c-accent)" />
                  <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', fontWeight: 600 }}>FREE RETURN SHIPPING</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--c-muted)', lineHeight: 1.55 }}>
                  Always free for the first return on an order. Prepaid FedEx label.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

window.ReturnsPage = ReturnsPage;
