// ============================================================
// Stehlen Auto — States canvas (empty/loading/error/404)
// ============================================================
const { I } = window.STEHLEN_UI;

function StatesCanvas({ mobile }) {
  const Frame = ({ title, children, height = 480 }) => (
    <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', fontWeight: 600 }}>{title}</span>
        <span className="mono" style={{ fontSize: 9, color: 'var(--c-muted-2)', letterSpacing: '0.1em' }}>STATE</span>
      </div>
      <div style={{ minHeight: height, padding: 24, background: 'var(--c-bg)' }}>{children}</div>
    </div>
  );

  // Loading product grid
  const LoadingGrid = () => (
    <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)', padding: 12 }}>
          <div className="skeleton" style={{ aspectRatio: '1', marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 8, width: '40%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 12, width: '90%', marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 12, width: '70%', marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 18, width: '40%' }} />
        </div>
      ))}
    </div>
  );

  return (
    <main className="container" style={{ padding: '32px 0' }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>04 · STATE VARIATIONS</div>
      <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 40, textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 32 }}>EDGES & FALLBACKS</h1>

      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
        {/* COLLECTION LOADING */}
        <Frame title="COLLECTION · LOADING">
          <LoadingGrid />
        </Frame>

        {/* COLLECTION EMPTY */}
        <Frame title="COLLECTION · NO RESULTS">
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: 'var(--c-surface)', border: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <I.search size={22} />
            </div>
            <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 20, textTransform: 'uppercase' }}>NO PARTS MATCH<br/>YOUR FILTERS</h3>
            <p style={{ color: 'var(--c-muted)', fontSize: 13, marginTop: 10, maxWidth: 360 }}>Try removing one or more filters, or change your vehicle. We've got 142 roof racks total — there's something here for you.</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="btn">CLEAR FILTERS</button>
              <button className="btn btn-primary">CHANGE VEHICLE</button>
            </div>
          </div>
        </Frame>

        {/* CART EMPTY */}
        <Frame title="CART · EMPTY DRAWER">
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
            <I.cart size={32} />
            <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 12 }}>Your cart is empty</h3>
            <p style={{ color: 'var(--c-muted)', fontSize: 13, marginTop: 6, maxWidth: 280 }}>Find parts that fit your vehicle to get started.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }}>BROWSE BEST SELLERS</button>
          </div>
        </Frame>

        {/* SEARCH NO RESULTS */}
        <Frame title="SEARCH · NO RESULTS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: 14, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)', display: 'flex', gap: 10, alignItems: 'center' }}>
              <I.search size={16} />
              <span className="mono" style={{ fontSize: 12 }}>"tonnaeu cover for 1992 yugo"</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--c-muted)' }}>0 results</span>
            </div>
            <div className="eyebrow">DID YOU MEAN</div>
            <a href="#" style={{ fontSize: 13 }}>→ Tonneau Covers</a>
            <div className="eyebrow" style={{ marginTop: 8 }}>POPULAR SEARCHES</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Roof Rack F-150','Bed Lights','Grille Silverado','Bull Bar','Running Boards'].map(s => (
                <span key={s} className="chip" style={{ cursor: 'pointer' }}>{s}</span>
              ))}
            </div>
          </div>
        </Frame>

        {/* FITMENT MISMATCH */}
        <Frame title="PDP · DOESN'T FIT VEHICLE">
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.4)', padding: 16, borderRadius: 'var(--r-md)', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--c-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.close size={14} stroke="#fff" sw={3} />
              </span>
              <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--c-danger)', fontWeight: 700 }}>DOES NOT FIT</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>This rack does not fit your 2010 Honda Civic</div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 4 }}>Built for full-size pickups (Ford F-150 / Chevy Silverado / Ram 1500). We've got 8 universal racks that may work — see below.</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-sm btn-primary">SHOP UNIVERSAL RACKS</button>
              <button className="btn btn-sm">CHANGE VEHICLE</button>
            </div>
          </div>
        </Frame>

        {/* OUT OF STOCK */}
        <Frame title="PDP · OUT OF STOCK">
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', padding: 16, borderRadius: 'var(--r-md)' }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--c-accent)', fontWeight: 700, marginBottom: 8 }}>BACKORDERED</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Restocking week of May 12, 2026</div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 4 }}>Order now to lock in current pricing. We'll ship the moment it arrives.</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-sm btn-primary">PRE-ORDER · $489</button>
              <button className="btn btn-sm">NOTIFY ME WHEN READY</button>
            </div>
          </div>
        </Frame>

        {/* NETWORK ERROR */}
        <Frame title="ERROR · NETWORK">
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <I.alert size={22} stroke="var(--c-danger)" />
            </div>
            <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 20, textTransform: 'uppercase' }}>SOMETHING WENT WRONG</h3>
            <p style={{ color: 'var(--c-muted)', fontSize: 13, marginTop: 10, maxWidth: 320 }}>We couldn't load that page. It's us, not you. Try refreshing — or call us at 1-888-378-4536 if it keeps happening.</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="btn">RELOAD</button>
              <button className="btn btn-primary">CONTACT SUPPORT</button>
            </div>
            <span className="mono" style={{ fontSize: 10, color: 'var(--c-muted-2)', letterSpacing: '0.1em', marginTop: 14 }}>ERROR CODE: STH_503_HTTP</span>
          </div>
        </Frame>

        {/* 404 */}
        <Frame title="404 · NOT FOUND">
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 80, fontWeight: 700, color: 'var(--c-accent)', lineHeight: 1, letterSpacing: '-0.04em' }}>404</div>
            <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 20, textTransform: 'uppercase', marginTop: 8 }}>WRONG TURN</h3>
            <p style={{ color: 'var(--c-muted)', fontSize: 13, marginTop: 8, maxWidth: 320 }}>The part you're looking for isn't here. It might have moved, sold out, or been renamed.</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="btn btn-primary">BACK TO HOME</button>
              <button className="btn">SEARCH PARTS</button>
            </div>
          </div>
        </Frame>
      </div>
    </main>
  );
}

window.StatesCanvas = StatesCanvas;
