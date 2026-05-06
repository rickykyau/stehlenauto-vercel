// ============================================================
// Stehlen Auto — Install Guide Article
// ============================================================
const { I, Stars } = window.STEHLEN_UI;

function InstallGuidePage({ onNav, mobile }) {
  const [activeStep, setActiveStep] = useState(3);

  const steps = [
    { n: 1, t: 'Unbox & inventory', time: '5 min' },
    { n: 2, t: 'Mount the side rails', time: '15 min' },
    { n: 3, t: 'Set the crossbars', time: '8 min' },
    { n: 4, t: 'Torque to spec', time: '4 min' },
    { n: 5, t: 'Final check & water test', time: '3 min' },
  ];

  return (
    <main>
      {/* breadcrumb */}
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: '14px 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); onNav('home'); }} className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', letterSpacing: '0.1em' }}>HOME</a>
          <I.chevRight size={11} stroke="var(--c-muted-2)" />
          <span className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', letterSpacing: '0.1em' }}>INSTALL GUIDES</span>
          <I.chevRight size={11} stroke="var(--c-muted-2)" />
          <span className="mono" style={{ fontSize: 11, letterSpacing: '0.1em' }}>F-150 ROOF RACK</span>
        </div>
      </div>

      <div className="container" style={{ padding: mobile ? '32px 0' : '56px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>INSTALL GUIDE</div>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 36 : 60, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 0.95, marginBottom: 16, maxWidth: 900 }}>
          ROOF RACK INSTALL —<br/>2021–2024 F-150 SUPERCREW
        </h1>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <I.clock size={14} stroke="var(--c-muted)" />
            <span style={{ fontSize: 13, color: 'var(--c-muted)' }}><strong style={{ color: 'var(--c-text)' }}>~35 min</strong> total time</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <I.wrench size={14} stroke="var(--c-muted)" />
            <span style={{ fontSize: 13, color: 'var(--c-muted)' }}><strong style={{ color: 'var(--c-text)' }}>Easy</strong> · 1 person</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <I.alert size={14} stroke="var(--c-success)" />
            <span style={{ fontSize: 13, color: 'var(--c-success)' }}><strong>No drilling</strong> required</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--c-muted)' }}>
            <Stars rating={4.8} size={12} />
            <span style={{ fontSize: 13 }}>4.8 · 240 installers</span>
          </span>
        </div>

        {/* Hero video */}
        <div style={{ position: 'relative', aspectRatio: '16 / 9', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: 40 }}>
          <img src="assets/hero-stehlen.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
          <button style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--c-accent)', border: 0, color: 'var(--c-bg)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span className="mono" style={{ fontSize: 11, color: '#fff', letterSpacing: '0.14em', background: 'rgba(0,0,0,0.7)', padding: '6px 10px', borderRadius: 4 }}>WATCH · 12:18</span>
            <span className="mono" style={{ fontSize: 11, color: '#fff', letterSpacing: '0.14em', background: 'rgba(0,0,0,0.7)', padding: '6px 10px', borderRadius: 4 }}>OR READ THE STEPS BELOW ↓</span>
          </div>
        </div>

        {/* Tools + parts strip */}
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 40 }}>
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 20 }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 700, marginBottom: 14 }}>TOOLS YOU'LL NEED</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {['10mm socket', '13mm socket', 'Torque wrench', 'T25 Torx', 'Painter\'s tape', 'Microfiber cloth'].map(t => (
                <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <I.check size={11} stroke="var(--c-success)" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 20 }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 700, marginBottom: 14 }}>WHAT'S IN THE BOX</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['×2', 'Side rails'], ['×2', 'Crossbars'], ['×8', 'Mount feet'], ['×16', 'M8 bolts'], ['×16', 'Washers'], ['×1', 'Hex key']].map(([n, t]) => (
                <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span className="mono" style={{ color: 'var(--c-accent)', fontWeight: 700, minWidth: 22 }}>{n}</span> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Step layout — sidebar + content */}
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '260px 1fr', gap: 32 }}>
          {/* Step nav */}
          <aside style={{ alignSelf: 'flex-start', position: mobile ? 'static' : 'sticky', top: 88 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--c-muted)', marginBottom: 12 }}>STEPS</div>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0, borderLeft: '1px solid var(--c-border)' }}>
              {steps.map(s => {
                const active = s.n === activeStep;
                const done = s.n < activeStep;
                return (
                  <li key={s.n}>
                    <button onClick={() => setActiveStep(s.n)} style={{
                      width: '100%', textAlign: 'left',
                      padding: '12px 16px',
                      background: 'transparent', border: 0,
                      borderLeft: active ? '2px solid var(--c-accent)' : '2px solid transparent',
                      marginLeft: -1,
                      color: 'var(--c-text)',
                      cursor: 'pointer',
                      display: 'grid', gridTemplateColumns: '24px 1fr', gap: 12, alignItems: 'center',
                    }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: done ? 'var(--c-success)' : (active ? 'var(--c-accent)' : 'var(--c-surface-2)'),
                        color: done || active ? 'var(--c-bg)' : 'var(--c-muted-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--f-display)', fontSize: 11, fontWeight: 700,
                      }}>{done ? <I.check size={11} stroke="var(--c-bg)" sw={3} /> : s.n}</span>
                      <span>
                        <div style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>{s.t}</div>
                        <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.08em', marginTop: 2 }}>{s.time.toUpperCase()}</div>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>

          {/* Step content */}
          <div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 14, color: 'var(--c-accent)', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 8 }}>STEP {activeStep} OF {steps.length}</div>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 28 : 40, textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 16 }}>
              {steps[activeStep - 1].t}.
            </h2>

            {/* Image */}
            <div className="product-img-bg" style={{ aspectRatio: '16 / 9', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
              <I.wrench size={64} stroke="var(--c-muted-2)" />
              <div style={{ position: 'absolute', top: 12, left: 12, background: 'var(--c-bg)', color: 'var(--c-text)', padding: '6px 10px', borderRadius: 4 }}>
                <span className="mono" style={{ fontSize: 10, letterSpacing: '0.12em' }}>FIG. 03 · CROSSBAR ALIGNMENT</span>
              </div>
            </div>

            <div style={{ fontSize: 16, color: 'var(--c-muted)', lineHeight: 1.8, marginBottom: 24 }}>
              <p style={{ marginTop: 0 }}>
                With both side rails seated, slide the front crossbar into the front T-channel until it stops against the limit pin. The pin is your alignment guide — if you hit it, you're square.
              </p>
              <p>
                Hand-thread the four M8 bolts (don't torque yet). Repeat for the rear crossbar. The rack should feel snug but still rotate <strong style={{ color: 'var(--c-text)' }}>±2mm</strong> for fine adjustment in the next step.
              </p>
            </div>

            {/* Pro tip */}
            <div style={{ background: 'var(--c-bg)', border: '1px solid var(--c-accent)', borderRadius: 'var(--r-md)', padding: 18, marginBottom: 24, display: 'grid', gridTemplateColumns: '24px 1fr', gap: 14 }}>
              <I.bolt size={20} stroke="var(--c-accent)" />
              <div>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 700, color: 'var(--c-accent)', marginBottom: 6 }}>PRO TIP</div>
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>If you're running a Yakima or Thule mount, set the bar spacing to 700mm — that's the OEM target for the F-150 SuperCrew. Don't trust the box label; measure.</div>
              </div>
            </div>

            {/* Watchout */}
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--r-md)', padding: 18, marginBottom: 24, display: 'grid', gridTemplateColumns: '24px 1fr', gap: 14 }}>
              <I.alert size={20} stroke="var(--c-danger)" />
              <div>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 700, color: 'var(--c-danger)', marginBottom: 6 }}>HEADS UP</div>
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>Don't fully torque the crossbars before the side rails. You'll get a 1–2mm offset that bites you on the water test.</div>
              </div>
            </div>

            {/* Step nav buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 32 }}>
              <button onClick={() => setActiveStep(s => Math.max(1, s - 1))} disabled={activeStep === 1} className="btn"><I.chevLeft size={12} /> PREV STEP</button>
              <button onClick={() => setActiveStep(s => Math.min(steps.length, s + 1))} className="btn btn-primary" style={{ flex: 1 }}>
                {activeStep === steps.length ? 'FINISH' : 'NEXT STEP'} <I.chevRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Help block */}
        <div style={{ marginTop: 64, padding: mobile ? 24 : 32, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr auto', gap: 20, alignItems: 'center' }}>
          <div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--c-accent)', fontWeight: 700, marginBottom: 6 }}>STUCK? REAL PEOPLE PICK UP.</div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 700, textTransform: 'uppercase' }}>Tech support, Mon–Sat 7AM–7PM PT.</div>
            <div style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 6 }}>Avg pickup time: 38 seconds. We've shipped this part 12,000+ times.</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => onNav('contact')} className="btn"><I.chat size={12}/> START CHAT</button>
            <button onClick={() => onNav('contact')} className="btn">CALL (888) 555-0188</button>
          </div>
        </div>
      </div>
    </main>
  );
}

window.InstallGuidePage = InstallGuidePage;
