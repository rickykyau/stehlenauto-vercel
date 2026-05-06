// ============================================================
// Stehlen Auto — Sign In / Create Account
// ============================================================
const { I, Logo } = window.STEHLEN_UI;

function AuthPage({ onNav, mobile }) {
  const [tab, setTab] = useState('signin');

  return (
    <main style={{ position: 'relative' }}>
      {/* Split layout: form panel + visual panel */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', minHeight: mobile ? 'auto' : '760px' }}>
        {/* LEFT — form */}
        <div style={{ padding: mobile ? '40px 24px 56px' : '72px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ maxWidth: 440, width: '100%', margin: '0 auto' }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>{tab === 'signin' ? 'WELCOME BACK' : 'JOIN STEHLEN'}</div>
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 36 : 52, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 0.95, marginBottom: 24 }}>
              {tab === 'signin' ? 'SIGN IN.\nKEEP BUILDING.' : 'BUILD AN\nACCOUNT.'}
            </h1>

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: '1px solid var(--c-border)' }}>
              {[['signin', 'SIGN IN'], ['signup', 'CREATE ACCOUNT']].map(([id, l]) => (
                <button key={id} onClick={() => setTab(id)} style={{
                  flex: 1,
                  background: 'transparent', border: 0,
                  padding: '14px 8px',
                  borderBottom: tab === id ? '2px solid var(--c-accent)' : '2px solid transparent',
                  marginBottom: -1,
                  color: tab === id ? 'var(--c-text)' : 'var(--c-muted)',
                  cursor: 'pointer',
                }}>
                  <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: tab === id ? 700 : 500 }}>{l}</span>
                </button>
              ))}
            </div>

            {/* Social */}
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 8, marginBottom: 24 }}>
              <button className="btn" style={{ height: 48 }}>
                <span style={{ fontFamily: 'var(--f-display)', fontWeight: 700 }}>G</span>&nbsp;
                CONTINUE WITH GOOGLE
              </button>
              <button className="btn" style={{ height: 48 }}>
                <span style={{ fontFamily: 'var(--f-display)', fontWeight: 700 }}>{`\u239E`}</span>&nbsp;
                CONTINUE WITH APPLE
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--c-border)' }} />
              <span className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.14em' }}>OR WITH EMAIL</span>
              <div style={{ flex: 1, height: 1, background: 'var(--c-border)' }} />
            </div>

            {tab === 'signin' ? (
              <form onSubmit={(e) => { e.preventDefault(); onNav('account'); }}>
                <div className="label-eyebrow">EMAIL</div>
                <input className="input" placeholder="you@example.com" defaultValue="mike.rodriguez@example.com" style={{ marginBottom: 14 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span className="label-eyebrow">PASSWORD</span>
                  <a href="#" style={{ fontSize: 11, color: 'var(--c-muted)', textDecoration: 'underline' }}>Forgot?</a>
                </div>
                <input className="input" type="password" placeholder="••••••••" defaultValue="••••••••••" style={{ marginBottom: 14 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--c-muted)', marginBottom: 20 }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: 'var(--c-accent)' }} /> Keep me signed in for 30 days
                </label>
                <button type="submit" className="btn btn-primary btn-lg btn-block">SIGN IN</button>
                <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--c-muted)', marginTop: 20 }}>
                  No account? <a href="#" onClick={(e) => { e.preventDefault(); setTab('signup'); }} style={{ color: 'var(--c-accent)', textDecoration: 'underline' }}>Create one</a> — takes a minute.
                </p>
              </form>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); onNav('account'); }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div className="label-eyebrow">FIRST NAME</div>
                    <input className="input" placeholder="Mike" />
                  </div>
                  <div>
                    <div className="label-eyebrow">LAST NAME</div>
                    <input className="input" placeholder="Rodriguez" />
                  </div>
                </div>
                <div className="label-eyebrow" style={{ marginTop: 14 }}>EMAIL</div>
                <input className="input" placeholder="you@example.com" style={{ marginBottom: 14 }} />
                <div className="label-eyebrow">PASSWORD</div>
                <input className="input" type="password" placeholder="At least 8 characters" style={{ marginBottom: 8 }} />
                {/* strength meter */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{ flex: 1, height: 4, background: i < 2 ? 'var(--c-accent)' : 'var(--c-surface-2)', borderRadius: 2 }} />
                  ))}
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: 'var(--c-muted)', marginBottom: 12, lineHeight: 1.6 }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: 'var(--c-accent)', marginTop: 3 }} />
                  <span>Email me $25 off my first $200+ order, plus install guides and product drops.</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: 'var(--c-muted)', marginBottom: 20, lineHeight: 1.6 }}>
                  <input type="checkbox" required style={{ accentColor: 'var(--c-accent)', marginTop: 3 }} />
                  <span>I agree to the <a href="#" style={{ color: 'var(--c-text)', textDecoration: 'underline' }}>Terms</a> and <a href="#" style={{ color: 'var(--c-text)', textDecoration: 'underline' }}>Privacy Policy</a>.</span>
                </label>
                <button type="submit" className="btn btn-primary btn-lg btn-block">CREATE ACCOUNT</button>
                <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--c-muted)', marginTop: 20 }}>
                  Already have one? <a href="#" onClick={(e) => { e.preventDefault(); setTab('signin'); }} style={{ color: 'var(--c-accent)', textDecoration: 'underline' }}>Sign in</a>
                </p>
              </form>
            )}

            <div style={{ marginTop: 32, padding: 14, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', display: 'flex', gap: 12 }}>
              <I.shield size={16} stroke="var(--c-success)" />
              <div>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', fontWeight: 600 }}>YOUR INFO IS SAFE</div>
                <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>256-bit SSL. We don't sell your data. Unsubscribe any time.</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — visual panel */}
        {!mobile && (
          <div style={{ position: 'relative', background: '#000', overflow: 'hidden', borderLeft: '1px solid var(--c-border)' }}>
            <img src="assets/hero-stehlen.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(10,10,10,0.85) 100%)' }} />
            <div style={{ position: 'relative', height: '100%', padding: 64, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Logo height={28} />
              <div>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--c-accent)', marginBottom: 16 }}>WHAT YOU GET WITH AN ACCOUNT</div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {[
                    { h: 'Garage with up to 5 vehicles', s: 'Save your year/make/model and we\'ll filter every page to only what fits.' },
                    { h: 'Order tracking + install guides', s: 'Live shipment status and the exact PDF/video for every part you bought.' },
                    { h: 'Loyalty rewards', s: '5 points per dollar. Stack with our $25-off welcome credit.' },
                    { h: 'Faster checkout', s: 'Saved addresses and cards. Apple/Google Pay one-tap.' },
                  ].map((b, i) => (
                    <li key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 14, alignItems: 'flex-start' }}>
                      <span style={{ width: 22, height: 22, marginTop: 2, borderRadius: '50%', background: 'var(--c-accent)', color: 'var(--c-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <I.check size={12} stroke="var(--c-bg)" sw={3} />
                      </span>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{b.h}</div>
                        <div style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 2, lineHeight: 1.55 }}>{b.s}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>Trusted by</span>
                <span className="mono" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.04em' }}>300,000+</span>
                <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>truck owners since 2015</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

window.AuthPage = AuthPage;
