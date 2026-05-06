// ============================================================
// Stehlen Auto — Order History List + Wishlist + Compare
// ============================================================
const { I, Stars } = window.STEHLEN_UI;

// -----------------------------
// ORDER HISTORY
// -----------------------------
function OrderHistoryPage({ onNav, mobile }) {
  const [filter, setFilter] = useState('all');
  const orders = [
    { id: 'STH-281-4422', date: 'Mar 12, 2026', status: 'in-transit', total: 1298.49, items: 3, eta: 'today' },
    { id: 'STH-271-1108', date: 'Feb 02, 2026', status: 'delivered',  total: 449.00,  items: 1 },
    { id: 'STH-262-0091', date: 'Dec 22, 2025', status: 'delivered',  total: 219.00,  items: 1 },
    { id: 'STH-258-9942', date: 'Nov 30, 2025', status: 'returned',   total: 89.00,   items: 1 },
    { id: 'STH-253-7720', date: 'Oct 14, 2025', status: 'delivered',  total: 749.00,  items: 1 },
    { id: 'STH-248-3301', date: 'Aug 22, 2025', status: 'delivered',  total: 1882.00, items: 4 },
  ];
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const STATUS = {
    'in-transit': { l: 'IN TRANSIT', c: 'var(--c-accent)' },
    'delivered':  { l: 'DELIVERED',  c: 'var(--c-success)' },
    'returned':   { l: 'RETURNED',   c: 'var(--c-muted)' },
  };

  return (
    <main>
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile ? '32px 0' : '48px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>YOUR ACCOUNT</div>
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 36 : 56, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>ORDERS</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onNav('account')} className="btn btn-sm">← BACK TO ACCOUNT</button>
            <button onClick={() => onNav('home')} className="btn btn-sm btn-primary">SHOP AGAIN</button>
          </div>
        </div>
      </div>
      <div className="container" style={{ padding: mobile ? '24px 0' : '32px 0' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {[['all','ALL ORDERS', orders.length],['in-transit','IN TRANSIT', orders.filter(o=>o.status==='in-transit').length],['delivered','DELIVERED', orders.filter(o=>o.status==='delivered').length],['returned','RETURNED', orders.filter(o=>o.status==='returned').length]].map(([k,l,n])=>(
            <button key={k} onClick={()=>setFilter(k)} className="chip" style={{height:32, padding:'0 14px', cursor:'pointer', background: filter===k?'var(--c-text)':'var(--c-surface)', color: filter===k?'var(--c-bg)':'var(--c-text)', borderColor: filter===k?'var(--c-text)':'var(--c-border)'}}>
              {l} <span style={{ opacity: 0.6, marginLeft: 6 }}>{n}</span>
            </button>
          ))}
        </div>
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
          {filtered.map((o, i) => {
            const s = STATUS[o.status];
            return (
              <a key={o.id} href="#" onClick={(e)=>{e.preventDefault(); onNav('order-detail');}} style={{
                display: 'grid', gridTemplateColumns: mobile ? '1fr' : '160px 1fr 140px 120px 100px auto',
                gap: 16, padding: 20, alignItems: 'center',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--c-border)' : 0,
              }}>
                <div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', letterSpacing: '0.1em' }}>{o.date.toUpperCase()}</div>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>{o.id}</div>
                </div>
                {!mobile && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {Array.from({length: Math.min(o.items, 3)}).map((_, j) => (
                      <div key={j} className="product-img-bg" style={{ width: 48, height: 48, borderRadius: 'var(--r-sm)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <I.box size={18} stroke="var(--c-muted-2)" />
                      </div>
                    ))}
                    {o.items > 3 && <div style={{ width: 48, height: 48, borderRadius: 'var(--r-sm)', background: 'var(--c-bg)', border: '1px solid var(--c-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 11, color: 'var(--c-muted)' }}>+{o.items-3}</div>}
                  </div>
                )}
                {!mobile && (
                  <div>
                    <span className="mono" style={{ fontSize: 10, color: s.c, letterSpacing: '0.12em', fontWeight: 700 }}>● {s.l}</span>
                    {o.eta && <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 4 }}>ARRIVES {o.eta.toUpperCase()}</div>}
                  </div>
                )}
                {!mobile && <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>{o.items} ITEM{o.items > 1 ? 'S' : ''}</span>}
                {!mobile && <span className="mono" style={{ fontSize: 16, fontWeight: 700 }}>${o.total.toFixed(2)}</span>}
                <I.chevRight size={14} stroke="var(--c-muted)" />
              </a>
            );
          })}
        </div>
      </div>
    </main>
  );
}

// -----------------------------
// WISHLIST
// -----------------------------
function WishlistPage({ onNav, vehicle, density, mobile }) {
  const products = window.STEHLEN_DATA.PRODUCTS;
  const items = products.slice(0, 6);
  return (
    <main>
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile ? '32px 0' : '48px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>YOUR ACCOUNT</div>
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 36 : 56, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>SAVED FOR LATER</h1>
            <p style={{ color: 'var(--c-muted)', fontSize: 14, marginTop: 8 }}>{items.length} items · We'll alert you on price drops.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm">SHARE LIST</button>
            <button className="btn btn-sm btn-primary">ADD ALL TO CART</button>
          </div>
        </div>
      </div>
      <div className="container" style={{ padding: mobile ? '24px 0' : '32px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16 }}>
          {items.map(p => (
            <div key={p.sku} style={{ position: 'relative' }}>
              <window.ProductCard product={p} density={density} onOpen={() => onNav('pdp')} vehicle={vehicle} />
              <button style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(10,10,10,0.8)', border: '1px solid var(--c-border)', color: 'var(--c-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }} title="Remove">
                <I.heart size={14} stroke="var(--c-accent)" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// -----------------------------
// COMPARE
// -----------------------------
function ComparePage({ onNav, vehicle, mobile }) {
  const products = window.STEHLEN_DATA.PRODUCTS;
  const items = products.slice(0, mobile ? 2 : 4);
  const SPECS = [
    ['Material', ['Aluminum 6061', 'Powder-coated steel', 'Aluminum 6061', 'Vinyl + aluminum frame']],
    ['Weight capacity', ['450 lbs static', '600 lbs static', '450 lbs dynamic', 'N/A']],
    ['Install time', ['25 min', '45 min', '30 min', '20 min']],
    ['Drilling required', ['No', 'No', 'No', 'No']],
    ['Lock included', ['No', 'No', 'No', 'Yes']],
    ['Warranty', ['Lifetime', 'Lifetime', 'Lifetime', '5 years']],
    ['Color options', ['Black, satin', 'Black', 'Black, raw', 'Black']],
    ['Made in', ['USA', 'Taiwan', 'USA', 'Taiwan']],
  ];
  return (
    <main>
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile ? '32px 0' : '48px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>COMPARE</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 36 : 56, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{items.length} PARTS, SIDE-BY-SIDE.</h1>
        </div>
      </div>
      <div className="container" style={{ padding: mobile ? '24px 0' : '40px 0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: mobile ? 600 : 'auto' }}>
          <thead>
            <tr>
              <th style={{ width: 180, textAlign: 'left', verticalAlign: 'bottom' }}></th>
              {items.map(p => (
                <th key={p.sku} style={{ verticalAlign: 'top', padding: 14, borderLeft: '1px solid var(--c-border)' }}>
                  <div className="product-img-bg" style={{ aspectRatio: '4 / 3', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, position: 'relative' }}>
                    <img src={p.image} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                    <button style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(10,10,10,0.8)', border: '1px solid var(--c-border)', color: 'var(--c-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.close size={11}/></button>
                  </div>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--c-muted-2)', letterSpacing: '0.1em' }}>{p.sku}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, textAlign: 'left' }}>{p.fitTitle}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <Stars rating={p.rating} size={11} />
                    <span className="mono" style={{ fontSize: 10, color: 'var(--c-muted)' }}>{p.reviews}</span>
                  </div>
                  <div className="mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 10, textAlign: 'left' }}>${p.price.toFixed(0)}</div>
                  <button onClick={() => onNav('pdp')} className="btn btn-sm btn-block btn-primary" style={{ marginTop: 10 }}>VIEW</button>
                </th>
              ))}
              {items.length < 4 && !mobile && (
                <th style={{ verticalAlign: 'top', padding: 14, borderLeft: '1px dashed var(--c-border)' }}>
                  <div style={{ aspectRatio: '4 / 3', border: '1px dashed var(--c-border)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--c-muted)' }}>
                    <div style={{ textAlign: 'center' }}>
                      <I.plus size={20} stroke="var(--c-muted)" />
                      <div className="mono" style={{ fontSize: 10, marginTop: 6, letterSpacing: '0.1em' }}>ADD A PART</div>
                    </div>
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {SPECS.map(([k, vals], i) => (
              <tr key={k} style={{ background: i % 2 === 0 ? 'var(--c-surface)' : 'transparent' }}>
                <td style={{ padding: 14, fontSize: 12, color: 'var(--c-muted)', borderTop: '1px solid var(--c-border)', verticalAlign: 'top' }}>
                  <span className="mono" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>{k}</span>
                </td>
                {items.map((p, j) => (
                  <td key={p.sku} style={{ padding: 14, fontSize: 13, fontWeight: 500, borderLeft: '1px solid var(--c-border)', borderTop: '1px solid var(--c-border)' }}>{vals[j] || '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

window.OrderHistoryPage = OrderHistoryPage;
window.WishlistPage = WishlistPage;
window.ComparePage = ComparePage;
