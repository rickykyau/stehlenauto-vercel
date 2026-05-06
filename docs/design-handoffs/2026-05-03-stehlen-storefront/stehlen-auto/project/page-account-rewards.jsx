// ============================================================
// Stehlen Auto — Bundle: Reviews + Loyalty + Refer + GiftCard + Garage Detail
// ============================================================
const { I, Stars } = window.STEHLEN_UI;

// ---- WRITE A REVIEW ----
function WriteReviewPage({ onNav, mobile }) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  return (
    <main>
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile ? '32px 0' : '48px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>REVIEW YOUR PURCHASE</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 36 : 56, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>HOW'D IT GO?</h1>
        </div>
      </div>
      <div className="container" style={{ padding: mobile ? '24px 0' : '40px 0', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 320px', gap: 32 }}>
        {submitted ? (
          <div style={{ padding: 32, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 700 }}>THANKS — REVIEW SUBMITTED.</div>
            <p style={{ color: 'var(--c-muted)', marginTop: 12 }}>It'll be live within 24 hours after our team verifies the purchase. We added 50 loyalty points to your account.</p>
            <button onClick={() => onNav('account')} className="btn btn-primary" style={{ marginTop: 16 }}>BACK TO ACCOUNT</button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 28 }}>
            <div className="label-eyebrow">YOUR RATING</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)} style={{ background: 'transparent', border: 0, cursor: 'pointer', color: (hover || rating) >= n ? 'var(--c-accent)' : 'var(--c-border-2)', padding: 4 }}>
                  <I.star size={36} stroke="currentColor" />
                </button>
              ))}
              <span style={{ marginLeft: 12, alignSelf: 'center', color: 'var(--c-muted)', fontSize: 13 }}>{['','Hate it','Meh','OK','Like it','Love it'][hover || rating]}</span>
            </div>
            <div className="label-eyebrow">REVIEW TITLE</div>
            <input className="input" placeholder="Sums up how you feel" style={{ marginBottom: 14 }} />
            <div className="label-eyebrow">YOUR REVIEW</div>
            <textarea className="input" rows={6} placeholder="What worked. What didn't. How long did it take? Tell another truck owner what you wish you'd known." style={{ height: 'auto', padding: 12, resize: 'vertical', fontFamily: 'var(--f-body)', fontSize: 13, textTransform: 'none', letterSpacing: 0, marginBottom: 14 }} />

            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
              <div><div className="label-eyebrow">FIT</div>
                <select className="select"><option>Fits perfectly</option><option>A bit tight</option><option>Loose</option></select>
              </div>
              <div><div className="label-eyebrow">QUALITY</div>
                <select className="select"><option>Excellent</option><option>Good</option><option>Average</option><option>Poor</option></select>
              </div>
              <div><div className="label-eyebrow">EASE OF INSTALL</div>
                <select className="select"><option>Easy</option><option>Moderate</option><option>Hard</option></select>
              </div>
            </div>

            <div className="label-eyebrow">PHOTOS (UP TO 6)</div>
            <div style={{ padding: 32, border: '1px dashed var(--c-border-2)', borderRadius: 'var(--r-md)', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13, marginBottom: 16 }}>
              <I.box size={24} stroke="var(--c-muted-2)" /><br/>Drag photos or <button type="button" style={{background:'transparent',border:0,color:'var(--c-accent)',textDecoration:'underline',cursor:'pointer',padding:0}}>browse</button>
            </div>

            <label style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--c-muted)', marginBottom: 18 }}>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--c-accent)' }} />
              I'd recommend this to a friend.
            </label>

            <button type="submit" className="btn btn-primary btn-lg btn-block">POST REVIEW · EARN 50 PTS</button>
          </form>
        )}
        {!mobile && !submitted && (
          <div style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 20 }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--c-accent)', fontWeight: 700, marginBottom: 10 }}>REVIEWING</div>
            <div className="product-img-bg" style={{ aspectRatio: '4 / 3', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <I.box size={32} stroke="var(--c-muted-2)" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Pro Modular Roof Rack — 2018 Ford F-150</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 4, letterSpacing: '0.08em' }}>SKU STH-RR-218 · BOUGHT FEB 12, 2026</div>
          </div>
        )}
      </div>
    </main>
  );
}

// ---- LOYALTY DASHBOARD ----
function LoyaltyPage({ onNav, mobile }) {
  const points = 1840;
  const tier = 'BUILDER';
  const next = 2500;
  const pct = (points / next) * 100;
  return (
    <main>
      <div style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, var(--c-bg) 100%)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile ? '32px 0' : '56px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 12, color: 'var(--c-accent)' }}>STEHLEN REWARDS · {tier} TIER</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 56 : 96, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.9, fontWeight: 800 }}>
            <span style={{ color: 'var(--c-accent)' }}>{points.toLocaleString()}</span> PTS
          </h1>
          <p style={{ marginTop: 16, fontSize: 16, color: 'var(--c-muted)', maxWidth: 560 }}>You're {next - points} points from <strong style={{ color: 'var(--c-text)' }}>FOREMAN</strong>. Free express shipping for life at that tier.</p>
          {/* progress */}
          <div style={{ marginTop: 24, maxWidth: 640 }}>
            <div style={{ height: 8, background: 'var(--c-surface)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: pct + '%', background: 'var(--c-accent)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--c-muted)', marginTop: 8 }} className="mono">
              <span>0 · ROOKIE</span><span>1,000 · CREW</span><span>2,500 · BUILDER</span><span>5,000 · FOREMAN</span>
            </div>
          </div>
        </div>
      </div>
      <div className="container" style={{ padding: mobile ? '24px 0' : '40px 0', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '2fr 1fr', gap: 24 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>WAYS TO EARN</div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 32 }}>
            {[['Spend $1','5 pts'],['Write a review','50 pts'],['Refer a friend','500 pts'],['Birthday','250 pts'],['First app order','100 pts'],['Follow on IG','25 pts']].map(([t,p])=>(
              <div key={t} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{t}</span>
                <span className="mono" style={{ color: 'var(--c-accent)', fontWeight: 700 }}>{p}</span>
              </div>
            ))}
          </div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>REDEEM</div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
            {[['$10 off','500 pts',true],['$25 off','1,200 pts',true],['$50 off','2,500 pts',false],['Free shipping','750 pts',true],['Free hat','1,500 pts',true],['Free install','5,000 pts',false]].map(([t,p,canRedeem])=>(
              <div key={t} style={{ background: canRedeem ? 'var(--c-bg)' : 'var(--c-surface)', border: `1px solid ${canRedeem?'var(--c-accent)':'var(--c-border)'}`, borderRadius: 'var(--r-md)', padding: 18, opacity: canRedeem?1:0.6 }}>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 700 }}>{t}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--c-accent)', letterSpacing: '0.1em', marginTop: 4 }}>{p}</div>
                <button className="btn btn-sm btn-block" disabled={!canRedeem} style={{ marginTop: 14 }}>{canRedeem?'REDEEM':'NEED MORE'}</button>
              </div>
            ))}
          </div>
        </div>
        <div style={{ alignSelf: 'flex-start' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>RECENT ACTIVITY</div>
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            {[['+50','Posted a review','Apr 8'],['+1,289','Order STH-281-4422','Mar 12'],['-500','Redeemed $10 off','Feb 28'],['+449','Order STH-271-1108','Feb 02'],['+250','Birthday bonus','Jan 14']].map(([p,t,d],i)=>(
              <div key={i} style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: i>0?'1px solid var(--c-border)':0 }}>
                <div>
                  <div style={{ fontSize: 13 }}>{t}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 2, letterSpacing: '0.08em' }}>{d.toUpperCase()}</div>
                </div>
                <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: p.startsWith('+')?'var(--c-success)':'var(--c-muted)' }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

// ---- REFER A FRIEND ----
function ReferPage({ onNav, mobile }) {
  return (
    <main>
      <div style={{ background: 'var(--c-accent)', color: 'var(--c-bg)' }}>
        <div className="container" style={{ padding: mobile ? '40px 0' : '72px 0', textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 12, letterSpacing: '0.16em', fontWeight: 700, marginBottom: 16 }}>REFER A FRIEND</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 56 : 120, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.85, fontWeight: 800 }}>
            GIVE $25.<br/>GET $25.
          </h1>
          <p style={{ marginTop: 20, fontSize: 18, maxWidth: 560, margin: '20px auto 0' }}>Friend buys their first $200+ part. They save $25, you get $25 in store credit. No cap on referrals.</p>
        </div>
      </div>
      <div className="container" style={{ padding: mobile ? '32px 0' : '56px 0' }}>
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: mobile ? 24 : 40, maxWidth: 700, margin: '0 auto' }}>
          <div className="label-eyebrow">YOUR REFERRAL LINK</div>
          <div style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
            <input className="input" readOnly value="stehlenauto.com/r/MIKE25" style={{ flex: 1, borderRadius: 'var(--r-md) 0 0 var(--r-md)', borderRightWidth: 0 }} />
            <button className="btn btn-primary" style={{ borderRadius: '0 var(--r-md) var(--r-md) 0' }}>COPY LINK</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 8, marginBottom: 32 }}>
            {['EMAIL','SMS','TWITTER','FACEBOOK'].map(c => <button key={c} className="btn btn-sm">{c}</button>)}
          </div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>OR EMAIL DIRECTLY</div>
          <textarea className="input" rows={3} placeholder="friend1@example.com, friend2@example.com" style={{ height: 'auto', padding: 12, resize: 'vertical', fontFamily: 'var(--f-body)', fontSize: 13, textTransform: 'none', letterSpacing: 0, marginBottom: 12 }} />
          <button className="btn btn-primary btn-block btn-lg">SEND INVITES</button>
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--c-border)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[['12','SENT'],['7','SIGNED UP'],['$125','EARNED']].map(([n,l])=>(
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 32, fontWeight: 800, color: 'var(--c-accent)' }}>{n}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.14em', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

// ---- GIFT CARD ----
function GiftCardPage({ onNav, mobile }) {
  const [amount, setAmount] = useState(100);
  const [design, setDesign] = useState('classic');
  return (
    <main>
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile ? '32px 0' : '56px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>GIFT CARDS</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 44 : 72, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>GIVE A BUILD.</h1>
        </div>
      </div>
      <div className="container" style={{ padding: mobile ? '24px 0' : '40px 0', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 32 }}>
        <div>
          {/* Card preview */}
          <div style={{
            aspectRatio: '1.6',
            borderRadius: 'var(--r-md)',
            background: design === 'classic' ? '#0a0a0a' : (design === 'yellow' ? 'var(--c-accent)' : 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)'),
            color: design === 'yellow' ? 'var(--c-bg)' : 'var(--c-text)',
            padding: 28,
            position: 'relative',
            border: design === 'classic' ? '1px solid var(--c-border)' : 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 14, fontWeight: 800, letterSpacing: '0.04em' }}>STEHLEN AUTO</div>
              <I.bolt size={18} stroke={design === 'yellow' ? 'var(--c-bg)' : 'var(--c-accent)'} />
            </div>
            <div>
              <div className="mono" style={{ fontSize: 10, opacity: 0.6, letterSpacing: '0.16em' }}>GIFT CARD</div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 64, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>${amount}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            {[['classic','Classic'],['yellow','Yellow'],['steel','Steel']].map(([id,l])=>(
              <button key={id} onClick={()=>setDesign(id)} className="chip" style={{height:30, padding:'0 14px', cursor:'pointer', background: design===id?'var(--c-text)':'var(--c-surface)', color: design===id?'var(--c-bg)':'var(--c-text)'}}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <form>
          <div className="label-eyebrow">AMOUNT</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 18 }}>
            {[25, 50, 100, 200, 500].map(a => (
              <button key={a} type="button" onClick={() => setAmount(a)} className="chip" style={{ height: 44, cursor: 'pointer', background: amount===a?'var(--c-accent)':'var(--c-surface)', color: amount===a?'var(--c-bg)':'var(--c-text)', borderColor: amount===a?'var(--c-accent)':'var(--c-border)' }}>
                <span className="mono" style={{ fontWeight: 700 }}>${a}</span>
              </button>
            ))}
          </div>
          <div className="label-eyebrow">DELIVER TO</div>
          <input className="input" placeholder="Recipient name" style={{ marginBottom: 8 }} />
          <input className="input" placeholder="Recipient email" style={{ marginBottom: 14 }} />
          <div className="label-eyebrow">MESSAGE</div>
          <textarea className="input" rows={3} placeholder="Get that bumper you've been talking about." style={{ height: 'auto', padding: 12, resize: 'vertical', fontFamily: 'var(--f-body)', fontSize: 13, textTransform: 'none', letterSpacing: 0, marginBottom: 14 }} />
          <div className="label-eyebrow">SEND ON</div>
          <input className="input" type="date" defaultValue="2026-05-12" style={{ marginBottom: 24 }} />
          <button type="button" onClick={() => onNav('checkout')} className="btn btn-primary btn-lg btn-block">CHECKOUT · ${amount}.00</button>
        </form>
      </div>
    </main>
  );
}

// ---- GARAGE DETAIL ----
function GarageDetailPage({ onNav, vehicle, mobile }) {
  const v = vehicle || { year: '2018', make: 'Ford', model: 'F-150' };
  return (
    <main>
      <div style={{ position: 'relative', background: '#000', overflow: 'hidden' }}>
        <img src="assets/hero-stehlen.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(10,10,10,0.95) 100%)' }} />
        <div className="container" style={{ position: 'relative', padding: mobile ? '32px 0' : '64px 0' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); onNav('account'); }} className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', letterSpacing: '0.12em' }}>← BACK TO GARAGE</a>
          <div className="eyebrow" style={{ marginTop: 16, marginBottom: 8, color: 'var(--c-accent)' }}>"BLACK BEAUTY" · PRIMARY</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 48 : 96, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.9, fontWeight: 800 }}>
            {v.year} {v.make.toUpperCase()}<br/><span style={{ color: 'var(--c-accent)' }}>{v.model.toUpperCase()}</span>
          </h1>
          <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span className="chip" style={{ height: 30, background: 'var(--c-surface)' }}>STX SUPERCREW</span>
            <span className="chip" style={{ height: 30, background: 'var(--c-surface)' }}>5.5' BED</span>
            <span className="chip" style={{ height: 30, background: 'var(--c-surface)' }}>3.5L ECOBOOST</span>
            <span className="chip" style={{ height: 30, background: 'var(--c-surface)' }}>VIN 1FTEW1EP•••</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: mobile ? '24px 0' : '40px 0', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '2fr 1fr', gap: 32 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>INSTALLED ON THIS TRUCK</div>
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            {[
              { t: 'Pro Modular Roof Rack', sku: 'STH-RR-218', date: 'Mar 14, 2026', miles: '38,420' },
              { t: 'LED Bed Light Kit',      sku: 'STH-LED-04', date: 'Feb 04, 2026', miles: '37,180' },
              { t: 'Mesh Grille Insert',     sku: 'STH-G-G2',   date: 'Dec 23, 2025', miles: '34,560' },
            ].map((p, i) => (
              <div key={p.sku} style={{ display: 'grid', gridTemplateColumns: mobile?'48px 1fr':'48px 1fr 140px 100px auto', gap: 14, padding: 16, alignItems: 'center', borderTop: i > 0 ? '1px solid var(--c-border)' : 0 }}>
                <div className="product-img-bg" style={{ width: 48, height: 48, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.box size={18} stroke="var(--c-muted-2)"/></div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.t}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 2, letterSpacing: '0.06em' }}>{p.sku}</div>
                </div>
                {!mobile && <span className="mono" style={{ fontSize: 11, color: 'var(--c-muted)' }}>INSTALLED {p.date.toUpperCase()}</span>}
                {!mobile && <span className="mono" style={{ fontSize: 11, color: 'var(--c-muted-2)' }}>@ {p.miles} MI</span>}
                {!mobile && <button className="btn btn-sm">GUIDE</button>}
              </div>
            ))}
          </div>

          <div className="eyebrow" style={{ marginTop: 32, marginBottom: 12 }}>RECOMMENDED NEXT</div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12 }}>
            {window.STEHLEN_DATA.PRODUCTS.slice(0, 4).map(p => (
              <window.ProductCard key={p.sku} product={p} onOpen={() => onNav('pdp')} vehicle={vehicle} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 18 }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 700, marginBottom: 12 }}>VEHICLE NOTES</div>
            <div style={{ fontSize: 13, color: 'var(--c-muted)', lineHeight: 1.7 }}>
              Bed: <strong style={{ color: 'var(--c-text)' }}>5.5'</strong><br/>
              Cab: <strong style={{ color: 'var(--c-text)' }}>SuperCrew</strong><br/>
              Lift: <strong style={{ color: 'var(--c-text)' }}>2" leveling</strong><br/>
              Tire: <strong style={{ color: 'var(--c-text)' }}>275/65R18</strong>
            </div>
            <button className="btn btn-sm btn-block" style={{ marginTop: 14 }}>EDIT NOTES</button>
          </div>
          <div style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 18 }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 700, marginBottom: 12 }}>MAINTENANCE LOG</div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', lineHeight: 1.7 }}>Track install dates and mileage so you know when to inspect bolts and re-torque. We'll remind you.</div>
            <button className="btn btn-sm btn-block" style={{ marginTop: 12 }}>+ ADD ENTRY</button>
          </div>
          <button onClick={() => onNav('vehicle-hub')} className="btn">SHOP F-150 PARTS →</button>
        </div>
      </div>
    </main>
  );
}

window.WriteReviewPage = WriteReviewPage;
window.LoyaltyPage = LoyaltyPage;
window.ReferPage = ReferPage;
window.GiftCardPage = GiftCardPage;
window.GarageDetailPage = GarageDetailPage;
