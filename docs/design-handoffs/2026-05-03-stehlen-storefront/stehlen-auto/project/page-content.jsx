// ============================================================
// Stehlen Auto — Content: Blog index + Article + Buyer's Guide
// ============================================================
const { I, Stars } = window.STEHLEN_UI;

const POSTS = [
  { tag: 'INSTALL',  t: 'Why your tonneau cover sags in cold weather (and the 30-second fix)', author: 'Ricky V.', date: 'Apr 22, 2026', read: '4 min', img: 'assets/tonneau-lock-roll-up.jpg', feat: true },
  { tag: 'BUYER\'S GUIDE', t: 'Modular vs full-width steel bumpers: which one for your build?', author: 'Marcus T.', date: 'Apr 14, 2026', read: '7 min', img: 'assets/bumper-modular.jpg' },
  { tag: 'OWNER STORIES', t: 'How a 2018 F-150 became a four-season overland rig', author: 'Jake P.', date: 'Apr 02, 2026', read: '6 min', img: 'assets/hero-stehlen.jpg' },
  { tag: 'TECH', t: 'Torque specs every truck owner should know by heart', author: 'Lina K.', date: 'Mar 28, 2026', read: '3 min', img: 'assets/product-grille.webp' },
  { tag: 'INSTALL', t: 'The 8 tools that make any bolt-on install 2x faster', author: 'Devon S.', date: 'Mar 20, 2026', read: '5 min', img: 'assets/product-roof-rack.webp' },
  { tag: 'BUYER\'S GUIDE', t: 'Bed lights: amber vs white, and when each one wins', author: 'Ricky V.', date: 'Mar 11, 2026', read: '4 min', img: 'assets/product-bed-lights.webp' },
];

function BlogIndexPage({ onNav, mobile }) {
  return (
    <main>
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile ? '32px 0' : '64px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>STEHLEN JOURNAL</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 44 : 88, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.9, fontWeight: 800 }}>
            FIELD NOTES<br/>FROM THE SHOP.
          </h1>
        </div>
      </div>
      <div className="container" style={{ padding: mobile ? '24px 0' : '40px 0' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
          {['ALL','INSTALL','BUYER\'S GUIDE','TECH','OWNER STORIES','PRESS'].map((c,i)=>(
            <button key={c} className="chip" style={{ height: 30, cursor: 'pointer', background: i===0?'var(--c-text)':'var(--c-surface)', color: i===0?'var(--c-bg)':'var(--c-text)' }}>{c}</button>
          ))}
        </div>
        {/* featured */}
        <a href="#" onClick={(e)=>{e.preventDefault(); onNav('article');}} style={{ display: 'grid', gridTemplateColumns: mobile?'1fr':'1.4fr 1fr', gap: 24, marginBottom: 40, color: 'var(--c-text)' }}>
          <div className="product-img-bg" style={{ aspectRatio: '16 / 10', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            <img src={POSTS[0].img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--c-accent)', fontWeight: 700 }}>FEATURED · {POSTS[0].tag}</div>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: mobile?28:44, textTransform: 'uppercase', letterSpacing: '-0.02em', marginTop: 12, lineHeight: 1.05 }}>{POSTS[0].t}</h2>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, fontSize: 13, color: 'var(--c-muted)' }}>
              <span>{POSTS[0].author}</span>·<span>{POSTS[0].date}</span>·<span>{POSTS[0].read} read</span>
            </div>
          </div>
        </a>
        <div style={{ display: 'grid', gridTemplateColumns: mobile?'1fr':'repeat(3, 1fr)', gap: 24 }}>
          {POSTS.slice(1).map(p => (
            <a key={p.t} href="#" onClick={(e)=>{e.preventDefault(); onNav('article');}} style={{ color: 'var(--c-text)' }}>
              <div className="product-img-bg" style={{ aspectRatio: '4 / 3', borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: 14 }}>
                <img src={p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--c-accent)', fontWeight: 700 }}>{p.tag}</div>
              <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 20, textTransform: 'uppercase', letterSpacing: '-0.01em', marginTop: 6, lineHeight: 1.15 }}>{p.t}</h3>
              <div style={{ display: 'flex', gap: 10, marginTop: 10, fontSize: 12, color: 'var(--c-muted)' }}><span>{p.author}</span>·<span>{p.read}</span></div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}

function ArticlePage({ onNav, mobile }) {
  return (
    <main>
      <div className="container" style={{ padding: '14px 0', borderBottom: '1px solid var(--c-border)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <a href="#" onClick={(e)=>{e.preventDefault(); onNav('blog');}} className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', letterSpacing: '0.1em' }}>← JOURNAL</a>
      </div>
      <article className="container" style={{ padding: mobile?'32px 0':'56px 0', maxWidth: 760 }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--c-accent)', fontWeight: 700 }}>INSTALL · APR 22, 2026</div>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile?36:60, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 0.95, marginTop: 12, marginBottom: 20 }}>
          Why your tonneau cover sags in cold weather (and the 30-second fix).
        </h1>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid var(--c-border)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--c-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--f-display)', fontWeight: 700 }}>RV</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Ricky V. <span style={{ color: 'var(--c-muted)', fontWeight: 500 }}>· Stehlen co-founder</span></div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>4 min read · 12,402 reads</div>
          </div>
        </div>
        <div className="product-img-bg" style={{ aspectRatio: '16/9', borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: 28 }}>
          <img src="assets/tonneau-lock-roll-up.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--c-text)' }}>
          <p style={{ fontFamily: 'var(--f-display)', fontSize: 22, color: 'var(--c-muted)', fontWeight: 500, marginTop: 0 }}>The cover doesn't actually sag. The vinyl contracts. Here's what's happening — and the two-bolt fix that takes longer to type than to do.</p>
          <p>If you've seen daylight under your tonneau on a cold morning, you're not alone. Vinyl contracts at roughly 0.6% per 50°F drop, which on a 6-foot bed turns into about a quarter inch of slack on either side. Combine that with a clamp set at room temperature and you've got a visible droop.</p>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 28, textTransform: 'uppercase', marginTop: 36, marginBottom: 14 }}>The 30-second fix</h2>
          <p>Loosen the front clamps a half-turn. Pull the cover forward toward the cab. Re-tighten. The tension shifts to where the rear bows can take it back up.</p>
          <blockquote style={{ borderLeft: '3px solid var(--c-accent)', padding: '12px 0 12px 24px', margin: '24px 0', fontStyle: 'italic', color: 'var(--c-muted)', fontSize: 18 }}>
            "We didn't ship our Lock & Roll-Up until we'd tested it through three winters in Montana. The fix is built in — most owners never need it."
          </blockquote>
          <p>If you're seeing more than half an inch of sag, check the bow assemblies. Anything more is usually a clamp that walked loose. Re-torque to spec and you're done.</p>
        </div>
      </article>
      <div style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile?'32px 0':'48px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>KEEP READING</div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile?'1fr':'repeat(3, 1fr)', gap: 16 }}>
            {POSTS.slice(1, 4).map(p => (
              <a key={p.t} href="#" onClick={(e)=>{e.preventDefault(); onNav('article');}} style={{ color: 'var(--c-text)' }}>
                <div className="product-img-bg" style={{ aspectRatio: '4/3', borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: 10 }}>
                  <img src={p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--c-accent)', letterSpacing: '0.14em', fontWeight: 700 }}>{p.tag}</div>
                <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 18, textTransform: 'uppercase', marginTop: 4, lineHeight: 1.15 }}>{p.t}</h3>
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function BuyersGuideHubPage({ onNav, mobile }) {
  const guides = [
    { cat: 'TONNEAU COVERS', t: 'How to choose a tonneau cover', sub: 'Roll-up, hard-fold, retractable, or hidden snap — the breakdown.', img: 'assets/tonneau-lock-roll-up.jpg' },
    { cat: 'BUMPERS', t: 'Modular vs full-width steel', sub: 'When you actually need recovery points and when style is enough.', img: 'assets/bumper-modular.jpg' },
    { cat: 'ROOF RACKS', t: 'Sizing your roof rack load', sub: 'Static vs dynamic capacity. Why most people get this wrong.', img: 'assets/product-roof-rack.webp' },
    { cat: 'GRILLES', t: 'Mesh vs billet vs OEM-style', sub: 'Light-bar prep, airflow, and the look you actually want.', img: 'assets/product-grille.webp' },
    { cat: 'BED LIGHTING', t: 'Amber vs white LEDs', sub: 'Off-road dust performance vs everyday job site visibility.', img: 'assets/product-bed-lights.webp' },
    { cat: 'INSTALL', t: 'No-drill installs explained', sub: 'How OEM mount points actually work, and what "bolt-on" means.', img: 'assets/hero-stehlen.jpg' },
  ];
  return (
    <main>
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile?'32px 0':'64px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>BUYER'S GUIDES</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile?44:88, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.9, fontWeight: 800 }}>
            BUY ONCE.<br/>BUY RIGHT.
          </h1>
          <p style={{ marginTop: 16, fontSize: 16, color: 'var(--c-muted)', maxWidth: 600 }}>Honest, opinionated guides from people who install this stuff every day.</p>
        </div>
      </div>
      <div className="container" style={{ padding: mobile?'24px 0':'40px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: mobile?'1fr':'repeat(3, 1fr)', gap: 16 }}>
          {guides.map(g => (
            <a key={g.t} href="#" onClick={(e)=>{e.preventDefault(); onNav('article');}} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden', color: 'var(--c-text)' }}>
              <div className="product-img-bg" style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                <img src={g.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: 18 }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--c-accent)', fontWeight: 700 }}>{g.cat}</div>
                <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 22, textTransform: 'uppercase', letterSpacing: '-0.01em', marginTop: 6, lineHeight: 1.1 }}>{g.t}</h3>
                <p style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 8, lineHeight: 1.55 }}>{g.sub}</p>
                <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--c-accent)', fontSize: 12 }} className="mono">READ GUIDE <I.arrowR size={11} /></div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}

window.BlogIndexPage = BlogIndexPage;
window.ArticlePage = ArticlePage;
window.BuyersGuideHubPage = BuyersGuideHubPage;
