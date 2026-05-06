// ============================================================
// Stehlen Auto — Company: Press + Careers + Dealers + Affiliate
// ============================================================
const { I } = window.STEHLEN_UI;

function PressPage({ onNav, mobile }) {
  const features = [
    { logo: 'TRUCK TREND', q: '"The yellow YMM bar removes the single biggest friction point in aftermarket parts."', date: 'MAR 2026' },
    { logo: 'OVERLAND J.', q: '"Stehlen\'s no-drill bolt-on philosophy is what the segment has needed for a decade."', date: 'FEB 2026' },
    { logo: 'WIRED', q: '"A direct-to-consumer brand that actually understands its mechanic."', date: 'NOV 2025' },
    { logo: '4WHEEL & OFF', q: '"The modular bumper hits a sweet spot we didn\'t know existed."', date: 'OCT 2025' },
  ];
  return (
    <main>
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile?'32px 0':'64px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>PRESS · MEDIA</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile?48:96, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.9, fontWeight: 800 }}>WHAT FOLKS<br/>ARE SAYING.</h1>
        </div>
      </div>
      <div className="container" style={{ padding: mobile?'24px 0':'48px 0', display: 'grid', gridTemplateColumns: mobile?'1fr':'2fr 1fr', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {features.map(f => (
            <div key={f.logo} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 28 }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', letterSpacing: '0.14em', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                <span>{f.logo}</span><span>{f.date}</span>
              </div>
              <p style={{ fontFamily: 'var(--f-display)', fontSize: 26, fontWeight: 600, marginTop: 16, lineHeight: 1.25 }}>{f.q}</p>
            </div>
          ))}
        </div>
        <div style={{ alignSelf: 'flex-start' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>MEDIA INQUIRIES</div>
          <div style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 20 }}>
            <p style={{ fontSize: 14, color: 'var(--c-muted)', lineHeight: 1.65 }}>For press, podcasts, partnerships, or product samples:</p>
            <a href="#" style={{ display: 'block', color: 'var(--c-accent)', fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 700, marginTop: 10 }}>press@stehlenauto.com</a>
            <button className="btn btn-block" style={{ marginTop: 16 }}>DOWNLOAD PRESS KIT (.ZIP)</button>
            <button className="btn btn-block" style={{ marginTop: 8 }}>BRAND ASSETS</button>
          </div>
        </div>
      </div>
    </main>
  );
}

function CareersPage({ onNav, mobile }) {
  const jobs = [
    { d: 'ENGINEERING', t: 'Senior Mechanical Engineer · Bumpers',  loc: 'Detroit, MI', type: 'Full-time' },
    { d: 'ENGINEERING', t: 'CAD Designer · Roof Racks',              loc: 'Remote (US)', type: 'Full-time' },
    { d: 'OPERATIONS',  t: 'Warehouse Lead · 2nd Shift',             loc: 'Reno, NV',    type: 'Full-time' },
    { d: 'CUSTOMER',    t: 'Fitment Specialist (former tech)',       loc: 'Remote (US)', type: 'Full-time' },
    { d: 'CUSTOMER',    t: 'Returns & Warranty Lead',                loc: 'Reno, NV',    type: 'Full-time' },
    { d: 'GROWTH',      t: 'Performance Marketing Manager',          loc: 'Remote (US)', type: 'Full-time' },
    { d: 'CONTENT',     t: 'Video Producer · Install Guides',        loc: 'Detroit, MI', type: 'Contract' },
  ];
  return (
    <main>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img src="assets/hero-stehlen.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,10,0.6), var(--c-bg))' }} />
        <div className="container" style={{ position: 'relative', padding: mobile?'40px 0':'80px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--c-accent)' }}>WE'RE HIRING</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile?48:120, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.85, fontWeight: 800 }}>BUILD THE TOOLS<br/>YOU'D WANT TO USE.</h1>
          <p style={{ marginTop: 20, fontSize: 17, color: 'var(--c-muted)', maxWidth: 600 }}>We make heavy-duty parts that bolt on and stay bolted on. We're looking for engineers, makers, and people who've gotten dirt under their fingernails.</p>
        </div>
      </div>
      <div className="container" style={{ padding: mobile?'24px 0':'48px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>{jobs.length} OPEN ROLES</div>
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
          {jobs.map((j,i) => (
            <a key={j.t} href="#" style={{ display: 'grid', gridTemplateColumns: mobile?'1fr':'140px 1fr 160px 100px auto', gap: 14, padding: 20, alignItems: 'center', borderTop: i>0?'1px solid var(--c-border)':0, color: 'var(--c-text)' }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--c-accent)', letterSpacing: '0.14em', fontWeight: 700 }}>{j.d}</span>
              <span style={{ fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 600 }}>{j.t}</span>
              {!mobile && <span className="mono" style={{ fontSize: 11, color: 'var(--c-muted)' }}>{j.loc.toUpperCase()}</span>}
              {!mobile && <span className="mono" style={{ fontSize: 11, color: 'var(--c-muted-2)' }}>{j.type.toUpperCase()}</span>}
              <I.arrowR size={14} stroke="var(--c-muted)" />
            </a>
          ))}
        </div>
        <div style={{ marginTop: 32, padding: 24, background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--c-muted)' }}>Don't see your role? We're growing fast.</p>
          <a href="#" style={{ color: 'var(--c-accent)', fontFamily: 'var(--f-display)', fontWeight: 700 }}>jobs@stehlenauto.com</a>
        </div>
      </div>
    </main>
  );
}

function DealersPage({ onNav, mobile }) {
  return (
    <main>
      <div style={{ background: 'var(--c-accent)', color: 'var(--c-bg)' }}>
        <div className="container" style={{ padding: mobile?'40px 0':'80px 0' }}>
          <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', fontWeight: 700, marginBottom: 12 }}>BECOME A DEALER · B2B</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile?48:108, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.85, fontWeight: 800 }}>SELL STEHLEN.<br/>STOCK FAST.</h1>
          <p style={{ marginTop: 20, fontSize: 17, maxWidth: 540, lineHeight: 1.55 }}>Wholesale pricing for installers, body shops, off-road outfitters, and fleet operators. Drop-ship or stock — your call.</p>
        </div>
      </div>
      <div className="container" style={{ padding: mobile?'32px 0':'56px 0', display: 'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr', gap: 40 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 16 }}>WHY STEHLEN WHOLESALE</div>
          {[
            ['DEALER PRICING', 'Volume tiers from 25–45% off MSRP. Net-30 after first 90 days.'],
            ['DROP-SHIP READY', 'No-cost drop-ship to your customer with your branded packing slip.'],
            ['CO-OP MARKETING',  '$2 per unit sold goes back into co-op marketing for your shop.'],
            ['DEDICATED REP',    'You get a real human on text/call within 4 business hours.'],
            ['LIFETIME WARRANTY',  'Same warranty terms as DTC. Warranty issues handled by us.'],
          ].map(([t, s]) => (
            <div key={t} style={{ padding: '20px 0', borderTop: '1px solid var(--c-border)', display: 'grid', gridTemplateColumns: '160px 1fr', gap: 24 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--c-accent)', letterSpacing: '0.12em', fontWeight: 700 }}>{t}</span>
              <span style={{ fontSize: 14, color: 'var(--c-muted)', lineHeight: 1.6 }}>{s}</span>
            </div>
          ))}
        </div>
        <form style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 28, alignSelf: 'flex-start' }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>APPLY · TAKES 4 MIN</div>
          <input className="input" placeholder="Business name" style={{ marginBottom: 8 }} />
          <input className="input" placeholder="DBA / trade name" style={{ marginBottom: 8 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input className="input" placeholder="Tax ID / EIN" />
            <input className="input" placeholder="Years in business" />
          </div>
          <select className="select" style={{ marginBottom: 8 }}>
            <option>Business type — installer / repair</option>
            <option>Off-road outfitter</option>
            <option>Body shop</option>
            <option>Fleet / commercial</option>
            <option>Online reseller</option>
          </select>
          <select className="select" style={{ marginBottom: 8 }}>
            <option>Estimated monthly volume</option>
            <option>$1k–5k</option><option>$5k–25k</option><option>$25k–100k</option><option>$100k+</option>
          </select>
          <input className="input" placeholder="Contact name" style={{ marginBottom: 8 }} />
          <input className="input" placeholder="Email" style={{ marginBottom: 8 }} />
          <input className="input" placeholder="Phone" style={{ marginBottom: 16 }} />
          <button type="button" className="btn btn-primary btn-lg btn-block">SUBMIT APPLICATION</button>
          <p style={{ fontSize: 12, color: 'var(--c-muted-2)', marginTop: 12, lineHeight: 1.55 }}>We respond within 2 business days. Approved partners get login + price book the same day.</p>
        </form>
      </div>
    </main>
  );
}

function AffiliatePage({ onNav, mobile }) {
  return (
    <main>
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile?'40px 0':'72px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--c-accent)' }}>AFFILIATE PROGRAM</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile?44:96, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.9, fontWeight: 800 }}>EARN <span style={{ color: 'var(--c-accent)' }}>10%</span><br/>ON EVERY ORDER.</h1>
          <p style={{ marginTop: 20, fontSize: 16, color: 'var(--c-muted)', maxWidth: 580 }}>For builders, YouTubers, IG creators, podcasters, and gearheads with an audience that needs to bolt stuff on.</p>
        </div>
      </div>
      <div className="container" style={{ padding: mobile?'32px 0':'56px 0', display: 'grid', gridTemplateColumns: mobile?'1fr':'repeat(4, 1fr)', gap: 14 }}>
        {[
          ['10%', 'BASE COMMISSION'],
          ['15%', 'AFTER 25 ORDERS/MO'],
          ['90 DAYS', 'COOKIE WINDOW'],
          ['NET-15', 'PAYOUT'],
        ].map(([n, l]) => (
          <div key={l} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 24 }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 44, fontWeight: 800, color: 'var(--c-accent)', lineHeight: 1 }}>{n}</div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--c-muted)', marginTop: 10 }}>{l}</div>
          </div>
        ))}
      </div>
      <div className="container" style={{ paddingBottom: 56, textAlign: 'center' }}>
        <button className="btn btn-primary btn-lg">APPLY TO PROGRAM</button>
        <p style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 12 }}>Approval typically within 48 hours.</p>
      </div>
    </main>
  );
}

window.PressPage = PressPage;
window.CareersPage = CareersPage;
window.DealersPage = DealersPage;
window.AffiliatePage = AffiliatePage;
