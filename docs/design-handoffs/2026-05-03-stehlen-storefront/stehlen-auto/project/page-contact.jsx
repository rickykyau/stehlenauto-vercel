// ============================================================
// Stehlen Auto — Contact Page
// ============================================================
const { I } = window.STEHLEN_UI;

function ContactPage({ onNav, mobile }) {
  const [topic, setTopic] = useState('order');
  const [submitted, setSubmitted] = useState(false);

  return (
    <main>
      {/* HERO */}
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile ? '40px 0' : '64px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>SUPPORT</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 48 : 88, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.9, fontWeight: 800 }}>
            REAL PEOPLE.<br/>
            <span style={{ color: 'var(--c-accent)' }}>NO PHONE TREE.</span>
          </h1>
          <p style={{ marginTop: 20, fontSize: mobile ? 16 : 18, color: 'var(--c-muted)', lineHeight: 1.7, maxWidth: 700 }}>
            Our team works out of Corona, CA. They've installed every part we sell. Pick the channel that fits your day.
          </p>
        </div>
      </div>

      {/* CHANNEL CARDS */}
      <div className="container" style={{ padding: mobile ? '24px 0' : '40px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { icon: <I.chat size={22} />, k: 'CHAT',   v: 'Live now', sub: 'Avg pickup 38s',     cta: 'START CHAT',  primary: true },
            { icon: <I.phone size={22}/>,k: 'PHONE',  v: '(888) 555-0188', sub: 'Mon–Sat · 7AM–7PM PT', cta: 'CALL NOW' },
            { icon: <I.mail size={22} />, k: 'EMAIL',  v: 'help@stehlenauto.com', sub: 'Replies within 4hrs', cta: 'EMAIL US' },
            { icon: <I.wrench size={22} />, k: 'TECH', v: 'Garage line',  sub: 'Speak to an installer', cta: 'TECH SUPPORT' },
          ].map((c, i) => (
            <div key={i} style={{
              background: c.primary ? 'var(--c-accent)' : 'var(--c-surface)',
              color: c.primary ? 'var(--c-bg)' : 'var(--c-text)',
              border: c.primary ? 'none' : '1px solid var(--c-border)',
              borderRadius: 'var(--r-md)',
              padding: 24,
              display: 'flex', flexDirection: 'column', gap: 12,
              position: 'relative',
            }}>
              {c.primary && (
                <span style={{ position: 'absolute', top: 14, right: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                  <span className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', fontWeight: 700 }}>ONLINE</span>
                </span>
              )}
              <span style={{ color: c.primary ? 'var(--c-bg)' : 'var(--c-accent)' }}>{c.icon}</span>
              <div>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', opacity: c.primary ? 0.8 : 1, color: c.primary ? 'var(--c-bg)' : 'var(--c-muted)', fontWeight: 600 }}>{c.k}</div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 700, marginTop: 4 }}>{c.v}</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{c.sub}</div>
              </div>
              <button className="btn btn-sm" style={{
                marginTop: 'auto',
                background: c.primary ? 'var(--c-bg)' : 'transparent',
                color: c.primary ? 'var(--c-text)' : 'var(--c-text)',
                borderColor: c.primary ? 'var(--c-bg)' : 'var(--c-border)',
              }}>{c.cta} <I.arrowR size={11} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* FORM + SIDEBAR */}
      <div className="container" style={{ padding: '0 0 64px', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1.4fr 1fr', gap: 32 }}>
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: mobile ? 24 : 32 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>SEND A MESSAGE</div>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 26 : 32, textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 20 }}>What's going on?</h2>

          {submitted ? (
            <div style={{ padding: 24, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--r-md)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--c-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <I.check size={18} stroke="var(--c-bg)" sw={3} />
              </span>
              <div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 700, textTransform: 'uppercase' }}>Got it. Talk soon.</div>
                <div style={{ fontSize: 14, color: 'var(--c-muted)', marginTop: 6 }}>Ticket <strong className="mono" style={{ color: 'var(--c-text)' }}>#STH-T-44291</strong> · we'll reply within 4 business hours to mike.rodriguez@example.com.</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={() => setSubmitted(false)} className="btn btn-sm">SEND ANOTHER</button>
                  <button onClick={() => onNav('account')} className="btn btn-sm">VIEW IN ACCOUNT</button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
              <div className="label-eyebrow">WHAT'S THIS ABOUT?</div>
              <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 6, marginBottom: 18 }}>
                {[
                  { id: 'order', l: 'Order issue', icon: <I.box size={14} /> },
                  { id: 'fit', l: 'Fitment help', icon: <I.truck size={14} /> },
                  { id: 'install', l: 'Install support', icon: <I.wrench size={14} /> },
                  { id: 'other', l: 'Something else', icon: <I.chat size={14} /> },
                ].map(t => {
                  const sel = topic === t.id;
                  return (
                    <button key={t.id} type="button" onClick={() => setTopic(t.id)} style={{
                      padding: '12px 10px',
                      background: sel ? 'var(--c-bg)' : 'transparent',
                      border: `1px solid ${sel ? 'var(--c-accent)' : 'var(--c-border)'}`,
                      borderRadius: 'var(--r-md)',
                      color: sel ? 'var(--c-text)' : 'var(--c-muted)',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      fontSize: 12,
                    }}>
                      <span style={{ color: sel ? 'var(--c-accent)' : 'var(--c-muted-2)' }}>{t.icon}</span>
                      {t.l}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                <div>
                  <div className="label-eyebrow">NAME</div>
                  <input className="input" placeholder="Mike Rodriguez" />
                </div>
                <div>
                  <div className="label-eyebrow">EMAIL</div>
                  <input className="input" type="email" placeholder="you@example.com" />
                </div>
              </div>

              {topic === 'order' && (
                <>
                  <div className="label-eyebrow" style={{ marginTop: 14 }}>ORDER NUMBER</div>
                  <input className="input" placeholder="STH-281-XXXX" defaultValue="STH-281-4422" />
                </>
              )}
              {topic === 'fit' && (
                <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr', gap: 12, marginTop: 14 }}>
                  <div><div className="label-eyebrow">YEAR</div><input className="input" placeholder="2022" /></div>
                  <div><div className="label-eyebrow">MAKE</div><input className="input" placeholder="Ford" /></div>
                  <div><div className="label-eyebrow">MODEL</div><input className="input" placeholder="F-150 XLT" /></div>
                </div>
              )}

              <div className="label-eyebrow" style={{ marginTop: 14 }}>MESSAGE</div>
              <textarea className="input" rows={5} placeholder="Tell us what's going on. The more detail, the faster we move." style={{ height: 'auto', padding: 12, resize: 'vertical', fontFamily: 'var(--f-body)', fontSize: 13, textTransform: 'none', letterSpacing: 0 }} />

              <div style={{ marginTop: 14, padding: 14, border: '1px dashed var(--c-border)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--c-muted)', fontSize: 13 }}>
                <I.box size={18} stroke="var(--c-muted)" />
                Drag photos here, or <button type="button" style={{ background: 'transparent', border: 0, color: 'var(--c-accent)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>browse</button>. Photos help us escalate damage and fitment claims.
              </div>

              <button type="submit" className="btn btn-primary btn-lg btn-block" style={{ marginTop: 20 }}>SEND MESSAGE <I.arrowR size={14} /></button>
              <p style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 12, textAlign: 'center' }}>
                Avg first reply: <strong style={{ color: 'var(--c-text)' }}>27 minutes</strong> during business hours.
              </p>
            </form>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Map / location */}
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            <div style={{ aspectRatio: '4 / 3', position: 'relative', background: '#1a1a1a' }}>
              <svg viewBox="0 0 400 300" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <defs>
                  <pattern id="grid2" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M24 0H0V24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="400" height="300" fill="url(#grid2)" />
                {/* roads */}
                <path d="M0,200 Q200,180 400,160" stroke="#383838" strokeWidth="6" fill="none" />
                <path d="M180,0 Q200,150 220,300" stroke="#383838" strokeWidth="4" fill="none" />
                <path d="M0,80 L400,100" stroke="#383838" strokeWidth="3" fill="none" />
                {/* pin */}
                <circle cx="200" cy="160" r="22" fill="none" stroke="#f5a823" strokeWidth="2" opacity="0.4">
                  <animate attributeName="r" values="14;36;14" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="2.4s" repeatCount="indefinite" />
                </circle>
                <circle cx="200" cy="160" r="10" fill="#f5a823" />
                <circle cx="200" cy="160" r="4" fill="#0a0a0a" />
              </svg>
            </div>
            <div style={{ padding: 18 }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--c-accent)', fontWeight: 700 }}>HQ + WAREHOUSE</div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 700, marginTop: 4 }}>1160 W RINCON ST</div>
              <div style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 2 }}>Corona, CA 92878</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                <span className="chip" style={{ height: 22, fontSize: 9 }}>OPEN MON–FRI 7–4</span>
                <span className="chip" style={{ height: 22, fontSize: 9 }}>WILL-CALL PICKUP</span>
              </div>
            </div>
          </div>

          {/* Self-serve links */}
          <div style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--c-border)' }}>
              <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 700 }}>FASTER ON YOUR OWN</span>
            </div>
            {[
              ['Track an order',           'order-detail'],
              ['Start a return',           'returns'],
              ['Lifetime warranty info',   'warranty'],
              ['Fitment guarantee',        'fitment'],
              ['Install guides',           'install-guide'],
            ].map(([l, p]) => (
              <button key={p} onClick={() => onNav(p)} style={{
                width: '100%', textAlign: 'left',
                padding: 14,
                background: 'transparent', border: 0,
                borderTop: '1px solid var(--c-border)',
                color: 'var(--c-text)',
                cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: 13,
              }}>
                {l}
                <I.arrowR size={12} stroke="var(--c-muted)" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

window.ContactPage = ContactPage;
