// ============================================================
// Stehlen Auto — Legal & Utility Pages (compact bundle)
// ============================================================
const { I } = window.STEHLEN_UI;

function LegalShell({ kind, mobile, sections }) {
  const TITLE = {
    privacy:    ['PRIVACY POLICY',     'How we handle your data. Plain English version up top, full version below.'],
    terms:      ['TERMS OF SERVICE',   'The rules of using Stehlenauto.com. Standard ecommerce terms.'],
    a11y:       ['ACCESSIBILITY',      'Our commitment to WCAG 2.1 AA. Tell us what we missed.'],
    shipping:   ['SHIPPING POLICY',    'When it ships, what it costs, and how to fix it when it doesn\'t arrive.'],
    prop65:     ['PROP 65 NOTICE',     'California Proposition 65 disclosure for our products.'],
  }[kind] || ['', ''];
  const [t, sub] = TITLE;
  return (
    <main>
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile?'32px 0':'56px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>LEGAL · UPDATED APR 2026</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile?36:64, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{t}</h1>
          <p style={{ color: 'var(--c-muted)', fontSize: 15, marginTop: 12, maxWidth: 640 }}>{sub}</p>
        </div>
      </div>
      <div className="container" style={{ padding: mobile?'24px 0':'40px 0', display: 'grid', gridTemplateColumns: mobile?'1fr':'200px 1fr', gap: 32 }}>
        {!mobile && (
          <nav style={{ alignSelf: 'flex-start', position: 'sticky', top: 88 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>JUMP TO</div>
            {sections.map((s, i) => <a key={i} href={`#s${i}`} style={{ display: 'block', padding: '6px 0', fontSize: 13, color: 'var(--c-muted)' }}>{s.h}</a>)}
          </nav>
        )}
        <div style={{ maxWidth: 720 }}>
          {sections.map((s, i) => (
            <section key={i} id={`s${i}`} style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 22, textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 12 }}>{i+1}. {s.h}</h2>
              {s.p.map((para, j) => <p key={j} style={{ color: 'var(--c-muted)', lineHeight: 1.75, fontSize: 15, marginBottom: 12 }}>{para}</p>)}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

function PrivacyPage({ mobile }) {
  return <LegalShell kind="privacy" mobile={mobile} sections={[
    { h: 'INFORMATION WE COLLECT', p: ['Name, email, address, phone, vehicle (YMM), order history, and the parts you save to your wishlist. Standard analytics: device, browser, pages visited, where you came from.', 'We do not collect VINs unless you give one to us for fitment confirmation.'] },
    { h: 'HOW WE USE IT', p: ['To ship orders, confirm fitment, send order updates, and recommend parts that match your truck.', 'For email marketing — but only if you opted in. Unsubscribe anytime; the link is at the bottom of every email.'] },
    { h: 'WHO WE SHARE IT WITH', p: ['Shipping carriers (UPS, FedEx, USPS), payment processor (Stripe), our drop-ship dealer partners (only when you order), and a small list of analytics tools (Plausible, Heap).', 'We do not sell your data. Period.'] },
    { h: 'YOUR RIGHTS', p: ['Request a copy of what we have, ask us to delete it, or correct it. Email privacy@stehlenauto.com — we respond within 30 days.', 'California, Virginia, Colorado, Connecticut, and Utah residents have additional rights under state law; the same email gets you those.'] },
    { h: 'COOKIES', p: ['We use first-party cookies for the cart, login, and YMM persistence. Third-party cookies for analytics and ad attribution. Manage them in our cookie preferences.'] },
  ]} />;
}

function TermsPage({ mobile }) {
  return <LegalShell kind="terms" mobile={mobile} sections={[
    { h: 'ACCOUNT', p: ['You must be 18+ to make an account. You\'re responsible for keeping your password safe.'] },
    { h: 'ORDERS & PRICING', p: ['Prices are in USD and may change without notice (we lock the price at order time). Sales tax is calculated at checkout.', 'We reserve the right to cancel obvious pricing errors before fulfillment.'] },
    { h: 'FITMENT GUARANTEE', p: ['Confirmed fitment via our YMM tool means we cover return shipping if a confirmed-fit part doesn\'t fit. The part still has to be unused and uninstalled.'] },
    { h: 'WARRANTY', p: ['Lifetime structural warranty against manufacturing defects. Covers the original purchaser. Wear items (vinyl, gaskets, LEDs) are covered for 5 years.', 'Warranty does not cover off-road damage, accidents, or modification.'] },
    { h: 'RETURNS', p: ['60-day returns on uninstalled parts. Installed parts go through warranty.', 'No restocking fee for confirmed-fit parts; 15% on custom or final-sale items.'] },
    { h: 'LIMITATION OF LIABILITY', p: ['We\'re not liable for indirect damages. Maximum liability is what you paid us for the part. The full disclaimers are in the all-caps section every ecommerce site has.'] },
  ]} />;
}

function AccessibilityPage({ mobile }) {
  return <LegalShell kind="a11y" mobile={mobile} sections={[
    { h: 'OUR COMMITMENT', p: ['We aim for WCAG 2.1 Level AA across the entire shop. We test with VoiceOver, NVDA, and keyboard-only navigation each release.'] },
    { h: 'CURRENT STATUS', p: ['As of April 2026: 96% AA conformance per third-party audit. Known gaps: a few PDF install guides need re-tagging (Q2 fix).'] },
    { h: 'TELL US WHAT WE MISSED', p: ['Hit a barrier? Email a11y@stehlenauto.com. We respond within 2 business days and prioritize fixes by impact.'] },
    { h: 'ASSISTIVE TECH WE TEST AGAINST', p: ['VoiceOver (macOS, iOS), NVDA + Firefox, JAWS + Chrome, TalkBack (Android), keyboard-only with no mouse.'] },
  ]} />;
}

function ShippingPolicyPage({ mobile }) {
  return <LegalShell kind="shipping" mobile={mobile} sections={[
    { h: 'PROCESSING', p: ['Orders placed before 2pm CT ship same day. After 2pm: next business day.'] },
    { h: 'TRANSIT TIMES', p: ['US Ground: 2–5 business days. Express: 1–2. Heavy items (bumpers, racks): 3–7 via freight.'] },
    { h: 'COSTS', p: ['Free ground shipping on orders over $99. Express and freight calculated at checkout.'] },
    { h: 'INTERNATIONAL', p: ['Canada and Mexico via DHL or UPS. Duties calculated at checkout. Other countries: contact support.'] },
    { h: 'IT DIDN\'T SHOW UP', p: ['Carrier says delivered but you don\'t have it: file with us within 7 days at help@stehlenauto.com. We\'ll resolve, not redirect.'] },
  ]} />;
}

function Prop65Page({ mobile }) {
  return <LegalShell kind="prop65" mobile={mobile} sections={[
    { h: 'WHAT IS PROP 65?', p: ['California\'s Safe Drinking Water and Toxic Enforcement Act of 1986 requires warnings on products that may expose Californians to chemicals known to cause cancer or reproductive harm.'] },
    { h: 'WHAT IT MEANS FOR OUR PRODUCTS', p: ['Many automotive parts contain steel, aluminum, brass, or coatings that fall under Prop 65. The warning does not mean the product is unsafe — it means we\'re required to disclose.'] },
    { h: 'PRODUCT WARNINGS', p: ['Each affected product page includes the specific chemical(s) in the Prop 65 disclosure section. The standard warning: WARNING — Cancer and Reproductive Harm — www.P65Warnings.ca.gov.'] },
  ]} />;
}

// ---- 404 ----
function NotFoundPage({ onNav, mobile }) {
  return (
    <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ textAlign: 'center', padding: mobile?'40px 0':'80px 0' }}>
        <div className="mono" style={{ fontSize: 12, letterSpacing: '0.16em', color: 'var(--c-accent)', fontWeight: 700, marginBottom: 12 }}>ERROR · 404</div>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile?96:240, textTransform: 'uppercase', letterSpacing: '-0.05em', lineHeight: 0.85, fontWeight: 800 }}>BOLT.<br/><span style={{ color: 'var(--c-accent)' }}>MISSING.</span></h1>
        <p style={{ fontSize: 17, color: 'var(--c-muted)', maxWidth: 480, margin: '24px auto 0', lineHeight: 1.6 }}>The page you're looking for got loose somewhere on the highway. Let's get you back to the parts.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
          <button onClick={() => onNav('home')} className="btn btn-primary btn-lg">BACK TO HOME</button>
          <button onClick={() => onNav('search')} className="btn btn-lg">SEARCH PARTS</button>
          <button onClick={() => onNav('contact')} className="btn btn-lg">GET HELP</button>
        </div>
      </div>
    </main>
  );
}

// ---- SITEMAP ----
function SitemapPage({ onNav, mobile }) {
  const groups = [
    { h: 'SHOP', items: [['Home','home'],['Search','search'],['Compare','compare'],['Build & Quote','build'],['Cart','cart']] },
    { h: 'CATEGORIES', items: [['Roof Racks','category-roof'],['Tonneau Covers','category-tonneau'],['Bumpers','category-bumpers'],['Grilles','category-grilles']] },
    { h: 'ACCOUNT', items: [['Sign in','signin'],['Account home','account'],['Orders','orders'],['Order detail','order-detail'],['Wishlist','wishlist'],['Garage','garage'],['Garage detail','garage-detail'],['Loyalty','loyalty'],['Refer a friend','refer'],['Notifications','notifications'],['Addresses','addresses'],['Payment','payment']] },
    { h: 'SUPPORT', items: [['Help center','help'],['Contact','contact'],['Track order','track'],['Returns','returns'],['Warranty','warranty'],['Install guides','install'],['Fitment','fitment']] },
    { h: 'CONTENT', items: [['Journal','blog'],['Article','article'],['Buyer\'s guides','guides']] },
    { h: 'COMPANY', items: [['About','about'],['Press','press'],['Careers','careers'],['Become a dealer','dealers'],['Affiliate','affiliate'],['Newsletter prefs','newsletter']] },
    { h: 'LEGAL', items: [['Privacy','privacy'],['Terms','terms'],['Accessibility','accessibility'],['Shipping policy','shipping-policy'],['Prop 65','prop65']] },
  ];
  return (
    <main>
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile?'32px 0':'48px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>SITEMAP</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile?44:80, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>EVERYTHING, IN ONE PLACE.</h1>
        </div>
      </div>
      <div className="container" style={{ padding: mobile?'24px 0':'40px 0', display: 'grid', gridTemplateColumns: mobile?'1fr 1fr':'repeat(4, 1fr)', gap: 32 }}>
        {groups.map(g => (
          <div key={g.h}>
            <div className="eyebrow" style={{ color: 'var(--c-accent)', marginBottom: 12 }}>{g.h}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {g.items.map(([l, p]) => (
                <li key={l}><a href="#" onClick={(e)=>{e.preventDefault(); onNav(p);}} style={{ color: 'var(--c-text)', fontSize: 13 }}>{l}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}

// ---- PROMO LANDING ----
function PromoPage({ onNav, mobile }) {
  const [t, setT] = useState({ h: 23, m: 14, s: 42 });
  useEffect(() => {
    const id = setInterval(() => setT(prev => {
      let s = prev.s - 1, m = prev.m, h = prev.h;
      if (s < 0) { s = 59; m -= 1; }
      if (m < 0) { m = 59; h -= 1; }
      if (h < 0) { h = 0; m = 0; s = 0; }
      return { h, m, s };
    }), 1000);
    return () => clearInterval(id);
  }, []);
  const fmt = n => String(n).padStart(2, '0');
  const products = window.STEHLEN_DATA.PRODUCTS.slice(0, 4);
  return (
    <main>
      <div style={{ background: '#0a0a0a', borderBottom: '1px solid var(--c-border)', position: 'relative', overflow: 'hidden' }}>
        <img src="assets/hero-stehlen.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />
        <div className="container" style={{ position: 'relative', padding: mobile?'40px 0':'80px 0', textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 12, letterSpacing: '0.16em', color: 'var(--c-accent)', fontWeight: 700, marginBottom: 16 }}>FLASH SALE · CODE: <strong>BOLTON25</strong></div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile?64:160, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.85, fontWeight: 800 }}>
            <span style={{ color: 'var(--c-accent)' }}>25% OFF.</span><br/>BOLT-ONS.
          </h1>
          <p style={{ marginTop: 20, fontSize: 17, color: 'var(--c-muted)', maxWidth: 540, margin: '20px auto 0' }}>Tonneau covers, roof racks, bumpers, grilles. No code stacking. While stock lasts.</p>
          {/* timer */}
          <div style={{ marginTop: 36, display: 'inline-flex', gap: 12, justifyContent: 'center' }}>
            {[['HRS', t.h], ['MIN', t.m], ['SEC', t.s]].map(([l, n]) => (
              <div key={l} style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: '14px 20px', minWidth: 90 }}>
                <div className="mono" style={{ fontSize: 36, fontWeight: 800, color: 'var(--c-accent)', lineHeight: 1 }}>{fmt(n)}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.16em', marginTop: 6 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="container" style={{ padding: mobile?'24px 0':'40px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>SHOP THE SALE</div>
        <div style={{ display: 'grid', gridTemplateColumns: mobile?'1fr 1fr':'repeat(4, 1fr)', gap: 16 }}>
          {products.map(p => (
            <window.ProductCard key={p.sku} product={p} onOpen={() => onNav('pdp')} />
          ))}
        </div>
      </div>
    </main>
  );
}

// ---- NEWSLETTER PREFS ----
function NewsletterPrefsPage({ onNav, mobile }) {
  const [prefs, setPrefs] = useState({ deals: true, news: true, install: false, newprod: true, frequency: 'weekly' });
  return (
    <main>
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile?'32px 0':'48px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>EMAIL PREFERENCES</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile?36:56, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>WE WON'T SPAM.</h1>
          <p style={{ fontSize: 14, color: 'var(--c-muted)', marginTop: 10 }}>Pick what's useful. Unsubscribe anytime.</p>
        </div>
      </div>
      <div className="container" style={{ padding: mobile?'24px 0':'40px 0', maxWidth: 600 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>WHAT YOU'D LIKE</div>
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
          {[
            ['deals',   'Sales & promos',          'Flash sales, holiday deals, member-only.'],
            ['news',    'Stehlen Journal',         'New articles, install guides, owner stories.'],
            ['install', 'Install reminders',       'Re-torque schedules and seasonal checks for your saved trucks.'],
            ['newprod', 'New product launches',    'When we ship something new for your make.'],
          ].map(([k, t, s], i) => (
            <label key={k} style={{ display: 'flex', gap: 16, padding: 18, alignItems: 'center', borderTop: i>0?'1px solid var(--c-border)':0, cursor: 'pointer' }}>
              <span style={{ position: 'relative', width: 44, height: 24, background: prefs[k]?'var(--c-accent)':'var(--c-border-2)', borderRadius: 12, transition: '0.15s' }}>
                <input type="checkbox" checked={prefs[k]} onChange={(e)=>setPrefs(p=>({...p,[k]:e.target.checked}))} style={{ opacity: 0, position: 'absolute', inset: 0 }} />
                <span style={{ position: 'absolute', top: 2, left: prefs[k]?22:2, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: '0.15s' }} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t}</div>
                <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{s}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="eyebrow" style={{ marginTop: 28, marginBottom: 12 }}>FREQUENCY</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['daily','DAILY'],['weekly','WEEKLY'],['monthly','MONTHLY']].map(([k,l])=>(
            <button key={k} onClick={()=>setPrefs(p=>({...p,frequency:k}))} className="chip" style={{ height: 36, padding: '0 18px', cursor: 'pointer', background: prefs.frequency===k?'var(--c-text)':'var(--c-surface)', color: prefs.frequency===k?'var(--c-bg)':'var(--c-text)' }}>{l}</button>
          ))}
        </div>
        <div style={{ marginTop: 32, display: 'flex', gap: 10 }}>
          <button className="btn btn-primary btn-lg" style={{ flex: 1 }}>SAVE PREFERENCES</button>
          <button className="btn btn-lg">UNSUBSCRIBE FROM ALL</button>
        </div>
      </div>
    </main>
  );
}

// ---- ACCOUNT SUB-PAGES (3 in 1) ----
function AccountSubPage({ kind, onNav, mobile }) {
  const SHELL = ({ title, sub, children }) => (
    <main>
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile?'32px 0':'48px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>YOUR ACCOUNT</div>
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile?36:56, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{title}</h1>
            <p style={{ color: 'var(--c-muted)', fontSize: 14, marginTop: 8 }}>{sub}</p>
          </div>
          <button onClick={() => onNav('account')} className="btn btn-sm">← ACCOUNT</button>
        </div>
      </div>
      <div className="container" style={{ padding: mobile?'24px 0':'40px 0' }}>{children}</div>
    </main>
  );

  if (kind === 'addresses') {
    const addrs = [
      { l: 'PRIMARY · SHIPPING', n: 'Mike Calderon', a: '4422 Sycamore Ave, Reno NV 89502', p: '+1 775 555 0144' },
      { l: 'SHOP', n: 'Mike Calderon (Shop)', a: '1108 Industrial Way, Sparks NV 89431', p: '+1 775 555 2210' },
      { l: 'BILLING', n: 'Mike Calderon', a: '4422 Sycamore Ave, Reno NV 89502', p: '+1 775 555 0144' },
    ];
    return (
      <SHELL title="ADDRESSES" sub="Where to ship and bill.">
        <div style={{ display: 'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr 1fr', gap: 14 }}>
          {addrs.map(a => (
            <div key={a.l} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 20 }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--c-accent)', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 12 }}>{a.l}</div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 16, fontWeight: 600 }}>{a.n}</div>
              <div style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 6, lineHeight: 1.6 }}>{a.a}<br/>{a.p}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                <button className="btn btn-sm" style={{ flex: 1 }}>EDIT</button>
                <button className="btn btn-sm">REMOVE</button>
              </div>
            </div>
          ))}
          <button className="btn btn-lg" style={{ minHeight: 160, border: '1px dashed var(--c-border-2)', background: 'transparent' }}>+ ADD ADDRESS</button>
        </div>
      </SHELL>
    );
  }
  if (kind === 'payment') {
    const cards = [
      { l: 'PRIMARY', t: 'Visa', last: '4242', exp: '08 / 27' },
      { l: 'WORK', t: 'Mastercard', last: '8801', exp: '02 / 28' },
    ];
    return (
      <SHELL title="PAYMENT METHODS" sub="Cards on file. We don't store the full number.">
        <div style={{ display: 'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr', gap: 14, maxWidth: 720 }}>
          {cards.map(c => (
            <div key={c.last} style={{ aspectRatio: '1.6', background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--c-accent)' }}>{c.l}</div>
                <I.cc size={20} stroke="var(--c-text)" />
              </div>
              <div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600, letterSpacing: '0.1em' }}>•••• {c.last}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 6, letterSpacing: '0.08em' }}>{c.t.toUpperCase()} · EXP {c.exp}</div>
              </div>
            </div>
          ))}
          <button className="btn btn-lg" style={{ aspectRatio: '1.6', border: '1px dashed var(--c-border-2)', background: 'transparent' }}>+ ADD CARD</button>
        </div>
      </SHELL>
    );
  }
  // notifications
  const channels = [
    ['Order updates',     'Always on. Required to ship.', true, true],
    ['Shipping & delivery', 'Tracking, delays, delivered.', true, true],
    ['Price drops',         'On things in your wishlist or cart.', true, false],
    ['Back in stock',       'When we restock something you watched.', true, false],
    ['New arrivals (your make)', 'Only when something new fits your truck.', false, false],
    ['Marketing & deals',   'Sales, member promos, holiday.', false, false],
  ];
  return (
    <SHELL title="NOTIFICATIONS" sub="Choose how we reach you. SMS rates may apply.">
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden', maxWidth: 800 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', padding: '14px 20px', background: 'var(--c-surface-2)', borderBottom: '1px solid var(--c-border)' }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 700 }}>EVENT</div>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 700, textAlign: 'center' }}>EMAIL</div>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 700, textAlign: 'center' }}>SMS</div>
        </div>
        {channels.map(([t, s, e, sms], i) => (
          <div key={t} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', padding: '16px 20px', borderTop: i>0?'1px solid var(--c-border)':0, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{t}</div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{s}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <input type="checkbox" defaultChecked={e} style={{ accentColor: 'var(--c-accent)', width: 18, height: 18 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <input type="checkbox" defaultChecked={sms} style={{ accentColor: 'var(--c-accent)', width: 18, height: 18 }} />
            </div>
          </div>
        ))}
      </div>
    </SHELL>
  );
}

// ---- GUEST ORDER TRACKING ----
function GuestTrackPage({ onNav, mobile }) {
  const [showResult, setShowResult] = useState(false);
  return (
    <main>
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile?'32px 0':'48px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>TRACK ORDER · NO ACCOUNT NEEDED</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile?36:56, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>WHERE'S MY PART?</h1>
        </div>
      </div>
      <div className="container" style={{ padding: mobile?'24px 0':'40px 0', maxWidth: 560 }}>
        {!showResult ? (
          <form onSubmit={(e)=>{e.preventDefault(); setShowResult(true);}} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 28 }}>
            <div className="label-eyebrow">ORDER NUMBER</div>
            <input className="input" placeholder="STH-281-4422" style={{ marginBottom: 14 }} />
            <div className="label-eyebrow">EMAIL OR ZIP</div>
            <input className="input" placeholder="you@example.com" style={{ marginBottom: 24 }} />
            <button type="submit" className="btn btn-primary btn-lg btn-block">TRACK</button>
          </form>
        ) : (
          <div>
            <button onClick={()=>setShowResult(false)} className="btn btn-sm" style={{ marginBottom: 16 }}>← LOOK UP DIFFERENT ORDER</button>
            <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 24 }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--c-accent)', letterSpacing: '0.14em', fontWeight: 700 }}>● IN TRANSIT · ARRIVES TOMORROW</div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 700, marginTop: 10 }}>STH-281-4422</div>
              <div style={{ marginTop: 24, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 14, left: 0, right: 0, height: 2, background: 'var(--c-border)' }} />
                <div style={{ position: 'absolute', top: 14, left: 0, width: '70%', height: 2, background: 'var(--c-accent)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                  {['ORDERED','PACKED','SHIPPED','OUT','DELIVERED'].map((s, i) => (
                    <div key={s} style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: i<=3?'var(--c-accent)':'var(--c-surface-2)', border: `2px solid ${i<=3?'var(--c-accent)':'var(--c-border)'}`, color: i<=3?'var(--c-bg)':'var(--c-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', position: 'relative', zIndex: 1, fontSize: 12, fontWeight: 700 }}>{i<=3?'✓':i+1}</div>
                      <div className="mono" style={{ fontSize: 9, color: i<=3?'var(--c-text)':'var(--c-muted)', marginTop: 6, letterSpacing: '0.1em' }}>{s}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ---- QUICK ORDER (BULK SKU PASTE) ----
function QuickOrderPage({ onNav, mobile }) {
  const [skus, setSkus] = useState('STH-RR-218, 2\nSTH-LED-04, 4\nSTH-T-T1, 1');
  const lines = skus.split('\n').map(l => l.trim()).filter(Boolean);
  const parsed = lines.map(l => {
    const [sku, qty] = l.split(',').map(s => s.trim());
    return { sku, qty: Number(qty) || 1, ok: /^STH-/.test(sku || ''), name: sku === 'STH-RR-218' ? 'Pro Modular Roof Rack' : sku === 'STH-LED-04' ? 'LED Bed Light Kit' : sku === 'STH-T-T1' ? 'Lock & Roll-Up Tonneau' : '—', price: 489.00 };
  });
  return (
    <main>
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile?'32px 0':'48px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>QUICK ORDER · DEALERS & FLEET</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile?36:60, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>PASTE A LIST. GO.</h1>
          <p style={{ fontSize: 14, color: 'var(--c-muted)', marginTop: 10, maxWidth: 580 }}>One SKU per line, comma quantity. We'll validate each and drop straight into your cart.</p>
        </div>
      </div>
      <div className="container" style={{ padding: mobile?'24px 0':'40px 0', display: 'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr', gap: 24 }}>
        <div>
          <div className="label-eyebrow">PASTE SKUS</div>
          <textarea className="input" value={skus} onChange={e=>setSkus(e.target.value)} rows={14} style={{ height: 'auto', padding: 14, resize: 'vertical', fontFamily: 'var(--f-mono)', fontSize: 13, textTransform: 'none', letterSpacing: 0 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn btn-sm">UPLOAD .CSV</button>
            <button className="btn btn-sm">DOWNLOAD TEMPLATE</button>
          </div>
        </div>
        <div>
          <div className="label-eyebrow">PARSED · {parsed.length} LINES · {parsed.filter(p=>p.ok).length} VALID</div>
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: 16 }}>
            {parsed.map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 110px 1fr 60px 80px', gap: 10, padding: '12px 14px', alignItems: 'center', borderTop: i>0?'1px solid var(--c-border)':0, fontSize: 13 }}>
                <span style={{ color: r.ok?'var(--c-success)':'var(--c-error)' }}>{r.ok?'●':'✕'}</span>
                <span className="mono" style={{ fontSize: 11, fontWeight: 700 }}>{r.sku || '—'}</span>
                <span style={{ color: 'var(--c-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                <span className="mono" style={{ fontSize: 12 }}>×{r.qty}</span>
                <span className="mono" style={{ fontSize: 12, fontWeight: 700, textAlign: 'right' }}>${(r.price * r.qty).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <button onClick={()=>onNav('cart')} className="btn btn-primary btn-lg btn-block">ADD {parsed.filter(p=>p.ok).length} ITEMS TO CART</button>
        </div>
      </div>
    </main>
  );
}

window.PrivacyPage = PrivacyPage;
window.TermsPage = TermsPage;
window.AccessibilityPage = AccessibilityPage;
window.ShippingPolicyPage = ShippingPolicyPage;
window.Prop65Page = Prop65Page;
window.NotFoundPage = NotFoundPage;
window.SitemapPage = SitemapPage;
window.PromoPage = PromoPage;
window.NewsletterPrefsPage = NewsletterPrefsPage;
window.AccountSubPage = AccountSubPage;
window.GuestTrackPage = GuestTrackPage;
window.QuickOrderPage = QuickOrderPage;
