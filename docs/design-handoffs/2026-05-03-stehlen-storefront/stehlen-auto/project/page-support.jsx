// ============================================================
// Stehlen Auto — Support hub
// ============================================================
const { I } = window.STEHLEN_UI;

function SupportPage({ onNav, mobile }) {
  const [q, setQ] = useState('');
  const [openFaq, setOpenFaq] = useState(0);

  const TOPICS = [
    { icon: <I.truck size={22}/>, title: 'FITMENT HELP', body: "Year/make/model questions, part-number lookups, OEM compatibility." },
    { icon: <I.shipping size={22}/>, title: 'SHIPPING & TRACKING', body: "Where's my order, delivery estimates, address changes." },
    { icon: <I.return size={22}/>, title: 'RETURNS & REFUNDS', body: "Start a return, refund timing, exchanges, defective parts." },
    { icon: <I.wrench size={22}/>, title: 'INSTALLATION', body: "Step-by-step PDFs, torque specs, install videos by part." },
    { icon: <I.shield size={22}/>, title: 'WARRANTY', body: "Lifetime structural warranty, finish coverage, claim a warranty." },
    { icon: <I.cart size={22}/>, title: 'ORDERING & PAYMENT', body: "Promo codes, financing, payment methods, order changes." },
  ];

  const FAQS = [
    { q: 'How do I know a part will fit my truck?',  a: "Every product page runs your year/make/model against our hand-verified fitment database. If we say it fits and it doesn't, we pay return shipping. Use the yellow YMM bar at the top of any page to lock in your vehicle." },
    { q: 'Do I need to drill anything to install?',   a: "No. Stehlen parts mount to factory holes with hand tools. If a product genuinely requires drilling, we say so on the product page in plain English." },
    { q: 'How fast does my order ship?',              a: "Orders placed before 2 PM PST Mon–Fri ship the same day from our Corona, CA warehouse. Standard Ground delivers in 4–6 business days; FedEx 2-Day and Overnight are available at checkout." },
    { q: 'What if a part doesn\'t fit?',              a: "We pay return shipping and refund in full. Email support@stehlenauto.com or call 1-888-378-4536 within 30 days of delivery." },
    { q: 'Do you offer install support?',             a: "Yes — every order ships with a printed install guide. Our techs answer install questions Mon–Fri 9–5 PST by phone, chat, or email. Most installs take 30–90 minutes." },
    { q: 'Is the warranty really lifetime?',          a: "Lifetime structural warranty on the metal — for as long as you own the part. Powder coat finish is covered for 5 years." },
    { q: 'Can I change or cancel my order?',          a: "Yes, within 60 minutes of placing it. Sign in and visit Account → Orders, or call us. Once an order ships we can\'t intercept it, but returns are easy." },
    { q: 'Do you ship outside the US?',               a: "We ship to all 50 states. International and APO/FPO orders are handled case-by-case — email support with your address and we\'ll quote freight." },
  ];

  return (
    <main>
      {/* HERO + SEARCH */}
      <section style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile ? '40px 0 32px' : '72px 0 56px', maxWidth: 880 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>SUPPORT</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 40 : 64, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 0.95 }}>
            HOW CAN WE<br/>HELP TODAY?
          </h1>
          <div style={{ marginTop: 28, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-muted)', display: 'flex' }}>
              <I.search size={18} />
            </span>
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              className="input"
              placeholder="Search the help center — fitment, returns, install guides…"
              style={{ height: 56, paddingLeft: 50, fontSize: 14, fontFamily: 'var(--f-body)', textTransform: 'none', letterSpacing: 0 }}
            />
            <button className="btn btn-primary" style={{ position: 'absolute', right: 6, top: 6, height: 44 }}>SEARCH</button>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', letterSpacing: '0.1em', alignSelf: 'center', marginRight: 4 }}>POPULAR:</span>
            {['Track my order', 'Start a return', 'Fitment guide', 'Install PDFs', 'Warranty claim'].map(t => (
              <button key={t} className="chip" style={{ height: 28, cursor: 'pointer' }} onClick={() => setQ(t)}>{t.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT METHODS */}
      <section className="container" style={{ padding: mobile ? '32px 0' : '48px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { i: <I.phone size={20}/>, t: 'CALL', s: '1-888-378-4536',           sub: 'Mon–Fri 9–5 PST',    cta: 'CALL NOW' },
            { i: <I.chat size={20}/>,  t: 'LIVE CHAT', s: 'Avg. response 2 min', sub: 'Online now',         cta: 'START CHAT', live: true },
            { i: <I.user size={20}/>,  t: 'EMAIL', s: 'support@stehlenauto.com', sub: 'Reply within 4 hrs', cta: 'EMAIL US' },
          ].map((c, i) => (
            <div key={i} style={{
              background: 'var(--c-surface)', border: '1px solid var(--c-border)',
              borderRadius: 'var(--r-md)', padding: 24,
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, background: 'var(--c-surface-2)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-accent)' }}>{c.i}</div>
                {c.live && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--c-success)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c-success)', boxShadow: '0 0 0 4px rgba(34,197,94,0.2)' }} />
                    <span className="mono" style={{ letterSpacing: '0.1em' }}>LIVE</span>
                  </span>
                )}
              </div>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 700, color: 'var(--c-muted)' }}>{c.t}</div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>{c.s}</div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>{c.sub}</div>
              <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start', marginTop: 8 }}>{c.cta}</button>
            </div>
          ))}
        </div>
      </section>

      {/* TOPICS */}
      <section className="container" style={{ padding: mobile ? '24px 0 32px' : '24px 0 56px' }}>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 26 : 32, textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 24 }}>BROWSE BY TOPIC</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)',
          borderTop: '1px solid var(--c-border)',
          borderLeft: !mobile ? '1px solid var(--c-border)' : 0,
        }}>
          {TOPICS.map((t, i) => (
            <button key={i} style={{
              background: 'transparent',
              borderRight: !mobile ? '1px solid var(--c-border)' : 0,
              borderBottom: '1px solid var(--c-border)',
              borderLeft: mobile ? '1px solid var(--c-border)' : 0,
              padding: 24, textAlign: 'left',
              cursor: 'pointer',
              color: 'var(--c-text)',
              transition: 'background 120ms ease',
              display: 'flex', flexDirection: 'column', gap: 12,
            }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-surface)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'var(--c-accent)' }}>{t.icon}</div>
                <I.arrowR size={16} stroke="var(--c-muted)" />
              </div>
              <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', fontWeight: 700 }}>{t.title}</div>
              <div style={{ fontSize: 13, color: 'var(--c-muted)', lineHeight: 1.5 }}>{t.body}</div>
            </button>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="container" style={{ padding: mobile ? '32px 0' : '48px 0', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 2fr', gap: 32 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>FREQUENTLY ASKED</div>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 32 : 40, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>
            STILL HAVE QUESTIONS?
          </h2>
          <p style={{ fontSize: 14, color: 'var(--c-muted)', marginTop: 14, lineHeight: 1.6 }}>
            The most common ones, answered straight. If yours isn't here, our techs are one click away.
          </p>
        </div>
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)' }}>
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? '1px solid var(--c-border)' : 0 }}>
                <button
                  onClick={() => setOpenFaq(open ? -1 : i)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '18px 24px',
                    background: 'transparent', border: 0, cursor: 'pointer',
                    color: 'var(--c-text)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                  }}>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{f.q}</span>
                  <span style={{ flexShrink: 0, color: 'var(--c-muted)' }}>{open ? <I.minus size={16}/> : <I.plus size={16}/>}</span>
                </button>
                {open && (
                  <div style={{ padding: '0 24px 22px', fontSize: 14, color: 'var(--c-muted)', lineHeight: 1.65 }}>
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* QUICK LINKS BAND */}
      <section style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile ? '32px 0' : '48px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>QUICK LINKS</div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12 }}>
            {[
              ['Track an order', () => onNav('account')],
              ['Start a return', null],
              ['Install guides (PDF)', null],
              ['Warranty claim', null],
              ['Bulk / wholesale', null],
              ['Affiliate program', null],
              ['Press inquiries', null],
              ['Contact a rep', null],
            ].map(([l, h], i) => (
              <a key={i} href="#" onClick={(e) => { e.preventDefault(); h && h(); }} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 18px',
                background: 'var(--c-bg)',
                border: '1px solid var(--c-border)',
                borderRadius: 'var(--r-md)',
                fontSize: 13, fontWeight: 500,
              }}>
                <span>{l}</span>
                <I.arrowR size={14} stroke="var(--c-muted)" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

window.SupportPage = SupportPage;
