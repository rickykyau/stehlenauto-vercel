// ============================================================
// Stehlen Auto — Product Detail Page (PDP)
// ============================================================
const { I, Stars, SpecRow } = window.STEHLEN_UI;

function PDPPage({ vehicle, onYMMOpen, onNav, onAddToCart, fitmentStyle = 'badge', mobile }) {
  const { ACTIVE_PRODUCT, PRODUCTS, REVIEWS } = window.STEHLEN_DATA;
  const p = ACTIVE_PRODUCT;
  const [imgIdx, setImgIdx] = useState(0);
  const [tab, setTab] = useState('fitment');
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState('5.5\' BED');
  const [bedLen, setBedLen] = useState('6.5\' BED');

  const images = [p.image, p.image, p.image, p.image, p.image, p.image];

  const FitmentBadge = () => {
    if (fitmentStyle === 'pill') {
      return vehicle ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 99, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.4)', color: 'var(--c-success)' }}>
          <I.check size={12} /><span className="mono" style={{ fontSize: 11, letterSpacing: '0.08em' }}>FITS YOUR {vehicle.year} {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()}</span>
        </div>
      ) : (
        <button onClick={onYMMOpen} className="chip" style={{ height: 28, fontSize: 11 }}>VERIFY FITMENT FOR YOUR VEHICLE →</button>
      );
    }
    if (fitmentStyle === 'banner') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: vehicle ? 'rgba(34,197,94,0.12)' : 'var(--c-surface-2)', border: `1px solid ${vehicle ? 'rgba(34,197,94,0.4)' : 'var(--c-border)'}`, borderRadius: 'var(--r-sm)' }}>
          {vehicle ? <I.check size={16} stroke="var(--c-success)" /> : <I.alert size={16} />}
          <span className="mono" style={{ fontSize: 12, letterSpacing: '0.08em', color: vehicle ? 'var(--c-success)' : 'var(--c-text)' }}>
            {vehicle ? `CONFIRMED FIT: ${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}` : 'SELECT YOUR VEHICLE TO CONFIRM FITMENT'}
          </span>
          {!vehicle && <button onClick={onYMMOpen} className="btn btn-sm" style={{ marginLeft: 'auto' }}>VERIFY</button>}
        </div>
      );
    }
    // hero badge (default)
    return (
      <div style={{
        background: vehicle ? 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 100%)' : 'var(--c-surface-2)',
        border: `1px solid ${vehicle ? 'rgba(34,197,94,0.5)' : 'var(--c-border)'}`,
        borderRadius: 'var(--r-md)',
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {vehicle && <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: 4, background: 'var(--c-success)' }} />}
        {vehicle ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--c-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.check size={14} stroke="var(--c-bg)" sw={3} />
              </span>
              <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--c-success)', fontWeight: 700 }}>CONFIRMED FITMENT</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Fits your {vehicle.year} {vehicle.make} {vehicle.model}</div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 4 }}>SuperCrew · 5.5' Bed · All trims · Engineered for direct bolt-on</div>
            <button onClick={onYMMOpen} style={{ background: 'transparent', border: 0, color: 'var(--c-muted)', fontSize: 11, marginTop: 8, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Change vehicle</button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <I.alert size={18} />
              <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 700 }}>VERIFY FITMENT</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>Will this fit your vehicle?</div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 4 }}>Tell us your year, make, and model — we'll confirm in seconds.</div>
            <button onClick={onYMMOpen} className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>SELECT YOUR VEHICLE →</button>
          </>
        )}
      </div>
    );
  };

  return (
    <main>
      {/* Breadcrumb */}
      <div className="container" style={{ padding: '16px 0', display: 'flex', gap: 6, fontSize: 12, color: 'var(--c-muted)', alignItems: 'center', flexWrap: 'wrap' }}>
        <a href="#" onClick={(e) => { e.preventDefault(); onNav('home'); }}>Home</a>
        <I.chevRight size={10}/><a href="#">Exterior</a>
        <I.chevRight size={10}/><a href="#" onClick={(e) => { e.preventDefault(); onNav('collection'); }}>Roof Racks</a>
        <I.chevRight size={10}/><span style={{ color: 'var(--c-text)' }}>{p.title}</span>
      </div>

      {/* Top split: gallery / buy box */}
      <div className="container" style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1.3fr 1fr', gap: mobile ? 24 : 48, paddingBottom: 48 }}>
        {/* GALLERY */}
        <div style={{ display: mobile ? 'block' : 'grid', gridTemplateColumns: mobile ? '1fr' : '64px 1fr', gap: 12 }}>
          {!mobile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {images.map((src, i) => (
                <button key={i} onClick={() => setImgIdx(i)} className="product-img-bg" style={{
                  width: 64, height: 64, padding: 4, borderRadius: 'var(--r-sm)',
                  border: i === imgIdx ? '2px solid var(--c-accent)' : '1px solid var(--c-border)',
                  cursor: 'pointer', overflow: 'hidden',
                }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </button>
              ))}
            </div>
          )}
          <div className="product-img-bg" style={{ borderRadius: 'var(--r-md)', position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
            <img src={images[imgIdx]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            <div className="mono" style={{ position: 'absolute', bottom: 12, left: 12, fontSize: 11, color: '#666', background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: 2, letterSpacing: '0.08em' }}>
              {imgIdx + 1} / {images.length}
            </div>
            <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 6 }}>
              <button onClick={() => setImgIdx((imgIdx - 1 + images.length) % images.length)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 0, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.chevLeft size={14}/></button>
              <button onClick={() => setImgIdx((imgIdx + 1) % images.length)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 0, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.chevRight size={14}/></button>
            </div>
          </div>
        </div>

        {/* BUY BOX (sticky on desktop) */}
        <div style={{ position: mobile ? 'static' : 'sticky', top: 160, alignSelf: 'start' }}>
          {/* Badges */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <span className="badge badge-best">BEST SELLER</span>
            <span className="chip">SKU: {p.sku}</span>
          </div>

          <h1 style={{ fontSize: mobile ? 22 : 26, fontWeight: 600, lineHeight: 1.2, marginBottom: 10 }}>
            Stehlen Door-Frame Mount Roof Rack — Fits 2014–2026 Ford F-150 / SuperCrew
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Stars rating={p.rating} size={14} />
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.06em' }}>{p.rating} ({p.reviews} reviews)</span>
            <span style={{ color: 'var(--c-muted-2)' }}>·</span>
            <span style={{ fontSize: 12, color: 'var(--c-success)' }}>{p.inventory} in stock</span>
          </div>

          {/* FITMENT */}
          <div style={{ marginBottom: 20 }}><FitmentBadge /></div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
            <span className="mono" style={{ fontSize: 36, fontWeight: 700 }}>${p.price.toFixed(2)}</span>
            {p.compareAt && <span className="mono" style={{ fontSize: 16, color: 'var(--c-muted)', textDecoration: 'line-through' }}>${p.compareAt.toFixed(2)}</span>}
            {p.compareAt && <span className="badge badge-sale">SAVE ${(p.compareAt - p.price).toFixed(0)}</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 20 }}>or 4 interest-free payments of ${(p.price/4).toFixed(2)} with <span style={{ color: 'var(--c-text)', fontWeight: 600 }}>Affirm</span></div>

          {/* Sub-model variant strip */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="label-eyebrow" style={{ marginBottom: 0 }}>BED LENGTH</span>
              <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>Selected: <strong style={{ color: 'var(--c-text)' }}>{bedLen}</strong></span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['5\' BED','5.5\' BED','6.5\' BED','8\' BED'].map(b => (
                <button key={b} onClick={() => setBedLen(b)} className="btn btn-sm" style={{
                  flex: 1,
                  background: bedLen === b ? 'var(--c-text)' : 'transparent',
                  color: bedLen === b ? 'var(--c-bg)' : 'var(--c-text)',
                  borderColor: bedLen === b ? 'var(--c-text)' : 'var(--c-border)',
                }}>{b}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <span className="label-eyebrow">CAB TYPE</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {['CREW CAB','SUPERCAB','REGULAR CAB'].map(c => (
                <button key={c} className="btn btn-sm" style={{ flex: 1, background: c === 'CREW CAB' ? 'var(--c-text)' : 'transparent', color: c === 'CREW CAB' ? 'var(--c-bg)' : 'var(--c-text)', borderColor: c === 'CREW CAB' ? 'var(--c-text)' : 'var(--c-border)' }}>{c}</button>
              ))}
            </div>
          </div>

          {/* Qty + Add to Cart */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', height: 56 }}>
              <button onClick={() => setQty(q => Math.max(1, q-1))} style={{ width: 44, height: '100%', background: 'transparent', border: 0, color: 'var(--c-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.minus size={14}/></button>
              <span className="mono" style={{ width: 36, textAlign: 'center', fontSize: 14 }}>{qty}</span>
              <button onClick={() => setQty(q => q+1)} style={{ width: 44, height: '100%', background: 'transparent', border: 0, color: 'var(--c-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.plus size={14}/></button>
            </div>
            <button onClick={onAddToCart} className="btn btn-primary btn-lg" style={{ flex: 1 }}>
              ADD TO CART · ${(p.price * qty).toFixed(2)}
            </button>
            <button className="btn btn-lg" aria-label="Wishlist" style={{ width: 56 }}><I.heart size={16}/></button>
          </div>
          <button className="btn btn-block" style={{ background: 'transparent', borderColor: 'var(--c-border-2)' }}>
            BUY NOW WITH AFFIRM
          </button>

          {/* Trust micro list */}
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { i: <I.shipping size={16}/>, t: <>Free shipping · Arrives <strong>Wed Apr 22 — Fri Apr 24</strong> to 90210</> },
              { i: <I.return size={16}/>,   t: '30-day hassle-free returns' },
              { i: <I.shield size={16}/>,   t: 'Lifetime structural warranty · 5-year finish' },
              { i: <I.wrench size={16}/>,   t: 'Drilling-free install · 60–90 minutes with 2 people' },
            ].map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: 'var(--c-muted)' }}>{it.i}</span><span>{it.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <section className="container" style={{ paddingBottom: 64 }}>
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--c-border)', overflowX: 'auto' }} className="no-scrollbar">
          {[
            ['fitment','FITMENT'],
            ['features','FEATURES'],
            ['specs','SPECS'],
            ['installation','INSTALLATION'],
            ['shipping','SHIPPING'],
            ['warranty','WARRANTY'],
            ['reviews',`REVIEWS (${p.reviews})`],
          ].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '14px 20px',
              background: 'transparent', border: 0, cursor: 'pointer',
              color: tab === k ? 'var(--c-text)' : 'var(--c-muted)',
              borderBottom: tab === k ? '2px solid var(--c-accent)' : '2px solid transparent',
              marginBottom: -1, whiteSpace: 'nowrap',
            }} className="mono" >
              <span style={{ fontSize: 12, letterSpacing: '0.1em', fontWeight: 500 }}>{label}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: '32px 0', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 48 }}>
          {tab === 'fitment' && (
            <>
              <div>
                <h3 className="mono" style={{ fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>VEHICLE COMPATIBILITY</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { yr: '2021–2026', cab: 'SuperCrew · 5.5\' Bed', fit: true },
                    { yr: '2015–2020', cab: 'SuperCrew · 5.5\' Bed', fit: true },
                    { yr: '2014',      cab: 'Crew Cab · 5.5\' Bed',  fit: true },
                    { yr: '2009–2013', cab: 'All bed lengths',        fit: false },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', alignItems: 'center', padding: 14, background: row.fit ? 'rgba(34,197,94,0.05)' : 'var(--c-surface)', border: `1px solid ${row.fit ? 'rgba(34,197,94,0.25)' : 'var(--c-border)'}`, borderRadius: 'var(--r-sm)' }}>
                      <span className="mono" style={{ fontSize: 12, letterSpacing: '0.06em' }}>{row.yr}</span>
                      <span style={{ fontSize: 13 }}>{row.cab}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: row.fit ? 'var(--c-success)' : 'var(--c-muted-2)' }}>
                        {row.fit ? <I.check size={14}/> : <I.close size={14}/>}
                        <span className="mono" style={{ fontSize: 11, letterSpacing: '0.08em' }}>{row.fit ? 'FITS' : 'DOESN\'T FIT'}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mono" style={{ fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>NOT SURE?</h3>
                <p style={{ fontSize: 14, color: 'var(--c-muted)', marginBottom: 20, lineHeight: 1.6 }}>
                  Tell us your year, make, and model and we'll confirm fitment instantly. Backed by our Fitment Guarantee — if it doesn't fit, we'll refund 100%.
                </p>
                <button onClick={onYMMOpen} className="btn btn-primary">VERIFY FITMENT FOR MY VEHICLE</button>
              </div>
            </>
          )}
          {tab === 'features' && (
            <div style={{ gridColumn: mobile ? 'auto' : '1 / -1', columnCount: mobile ? 1 : 2, columnGap: 48 }}>
              {[
                ['DOOR-FRAME MOUNT', 'Engineered to clamp to factory door frames — no drilling, no permanent modifications. Reversible with no trace.'],
                ['HEAVY-DUTY STEEL', '11-gauge cold-rolled steel construction. 600-lb static load rating. 250-lb dynamic capacity at highway speeds.'],
                ['SLOTTED CROSSBARS', 'Pre-cut accessory slots on every crossbar. Compatible with most aftermarket roof tents, awnings, and tie-downs.'],
                ['TEXTURED POWDER COAT', 'Triple-stage powder coating over zinc-rich primer. Tested to 1,000+ hours of salt-spray. UV-stable.'],
                ['FACTORY APPEARANCE', 'Low profile silhouette adds 4.2" to overall height. No wind noise up to 75 mph in our testing.'],
                ['BOLT-ON INSTALL', 'Includes all hardware, torque spec card, and step-by-step instructions. 60–90 minutes with 2 people.'],
              ].map(([head, body], i) => (
                <div key={i} style={{ breakInside: 'avoid', marginBottom: 20 }}>
                  <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--c-accent)', marginBottom: 6 }}>{head}</div>
                  <p style={{ fontSize: 14, color: 'var(--c-text)', lineHeight: 1.5, margin: 0 }}>{body}</p>
                </div>
              ))}
            </div>
          )}
          {tab === 'specs' && (
            <div style={{ gridColumn: mobile ? 'auto' : '1 / -1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: '0 64px' }}>
                {[
                  ['Material','11-gauge cold-rolled steel'],
                  ['Finish','Triple-stage powder coat, matte black'],
                  ['Static load rating','600 lbs'],
                  ['Dynamic load rating','250 lbs'],
                  ['Overall length','79"'],
                  ['Overall width','58"'],
                  ['Mounting height','4.2" above roof'],
                  ['Number of crossbars','5'],
                  ['Hardware','Grade-8 stainless'],
                  ['Country of origin','USA assembled'],
                  ['Package weight','78 lbs'],
                  ['Box dimensions','82" × 14" × 8"'],
                ].map(([k, v]) => <SpecRow key={k} label={k} value={v} />)}
              </div>
            </div>
          )}
          {tab === 'installation' && (
            <>
              <div>
                <h3 className="mono" style={{ fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>INSTALL OVERVIEW</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    ['1','Unbox and inventory hardware against the included packing list.'],
                    ['2','Mount door-frame brackets at marked positions; hand-tighten only.'],
                    ['3','Lift assembled rack onto truck (2 people) and seat onto brackets.'],
                    ['4','Torque all bolts to 18 ft-lb in the sequence shown on the spec card.'],
                    ['5','Verify torque after 100 miles, then again at 500 miles.'],
                  ].map(([n, t]) => (
                    <div key={n} style={{ display: 'grid', gridTemplateColumns: '36px 1fr', gap: 12, alignItems: 'baseline' }}>
                      <span className="mono" style={{ fontSize: 14, color: 'var(--c-accent)', fontWeight: 700 }}>0{n}</span>
                      <span style={{ fontSize: 14 }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', padding: 24, borderRadius: 'var(--r-md)' }}>
                <h3 className="mono" style={{ fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>RESOURCES</h3>
                {[
                  ['Installation Guide (PDF)', '4 pages'],
                  ['Installation Video', '12:34'],
                  ['Torque Spec Card', '1 page'],
                  ['Hardware Diagram', 'Exploded view'],
                ].map(([t, sub], i) => (
                  <a key={i} href="#" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: i === 0 ? '0' : '1px solid var(--c-border)' }}>
                    <div>
                      <div style={{ fontSize: 13 }}>{t}</div>
                      <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>{sub}</div>
                    </div>
                    <I.external size={14}/>
                  </a>
                ))}
              </div>
            </>
          )}
          {tab === 'shipping' && (
            <div style={{ gridColumn: mobile ? 'auto' : '1 / -1' }}>
              <h3 className="mono" style={{ fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>ESTIMATED DELIVERY · ZIP 90210</h3>
              <div style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                {[
                  ['CA / NV / UT / AZ',     '2–3 business days', 'FREE'],
                  ['Western states',        '3–4 business days', 'FREE'],
                  ['Midwest / Southern US', '4–5 business days', 'FREE'],
                  ['Northeast US',          '5–6 business days', 'FREE'],
                  ['Hawaii / Alaska / PR',  '7–10 business days','+ $89'],
                ].map(([region, days, cost], i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 100px', padding: 14, borderTop: i === 0 ? 0 : '1px solid var(--c-border)', alignItems: 'center', background: i % 2 ? 'var(--c-surface)' : 'transparent' }}>
                    <span style={{ fontSize: 13 }}>{region}</span>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--c-muted)', letterSpacing: '0.04em' }}>{days}</span>
                    <span className="mono" style={{ fontSize: 12, textAlign: 'right', color: cost === 'FREE' ? 'var(--c-success)' : 'var(--c-text)' }}>{cost}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 'warranty' && (
            <div style={{ gridColumn: mobile ? 'auto' : '1 / -1', maxWidth: 720 }}>
              <p style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 16 }}>
                <strong>Lifetime structural warranty.</strong> If the rack frame, crossbars, or mounting brackets fail under normal use, we'll replace it. Forever. No fine print.
              </p>
              <p style={{ fontSize: 14, color: 'var(--c-muted)', lineHeight: 1.6 }}>
                Plus a 5-year finish warranty against rust-through, peeling, and fade. Hardware is covered for 2 years against thread strip or seizure. Off-roading, racing, and commercial use are covered.
              </p>
              <button className="btn" style={{ marginTop: 16 }}>READ FULL WARRANTY POLICY →</button>
            </div>
          )}
          {tab === 'reviews' && (
            <div style={{ gridColumn: mobile ? 'auto' : '1 / -1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '300px 1fr', gap: 32, marginBottom: 32 }}>
                <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', padding: 24, borderRadius: 'var(--r-md)' }}>
                  <div className="mono" style={{ fontSize: 48, fontWeight: 700, lineHeight: 1 }}>{p.rating}</div>
                  <Stars rating={p.rating} size={16} />
                  <div style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 8 }}>Based on {p.reviews} verified reviews</div>
                  <div style={{ marginTop: 16 }}>
                    {[5,4,3,2,1].map(s => (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className="mono" style={{ fontSize: 11, width: 20 }}>{s}★</span>
                        <div style={{ flex: 1, height: 4, background: 'var(--c-bg)', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${[78,16,4,1,1][5-s]}%`, background: 'var(--c-accent)' }} />
                        </div>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--c-muted)', width: 24, textAlign: 'right' }}>{[78,16,4,1,1][5-s]}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {REVIEWS.map((r, i) => (
                    <div key={i} style={{ paddingBottom: 16, borderBottom: i < REVIEWS.length-1 ? '1px solid var(--c-border)' : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Stars rating={r.rating} size={12} />
                          <strong style={{ fontSize: 13 }}>{r.title}</strong>
                        </div>
                        <span className="mono" style={{ fontSize: 10, color: 'var(--c-success)', letterSpacing: '0.08em' }}>✓ VERIFIED · {r.vehicle.toUpperCase()}</span>
                      </div>
                      <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--c-text)' }}>{r.body}</p>
                      <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 6 }}>{r.name} · {r.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Cross-sell: similar / also bought */}
      <section className="container" style={{ paddingBottom: 64 }}>
        <h2 className="mono" style={{ fontSize: 14, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>SIMILAR PRODUCTS THAT FIT YOUR VEHICLE</h2>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16 }}>
          {PRODUCTS.slice(1, 5).map(prod => (
            <window.ProductCard key={prod.sku} product={prod} density="standard" onOpen={() => onNav('pdp')} vehicle={vehicle} />
          ))}
        </div>
      </section>

      {/* Back-in-stock + Prop 65 */}
      <section className="container" style={{ paddingBottom: 64, display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', padding: 24, borderRadius: 'var(--r-md)' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>STAY IN THE LOOP</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Back in stock alerts</h3>
          <p style={{ color: 'var(--c-muted)', fontSize: 13, marginBottom: 14 }}>Get notified the moment we restock or release a new variant for your vehicle.</p>
          <form style={{ display: 'flex', gap: 8 }} onSubmit={(e) => e.preventDefault()}>
            <input className="input" placeholder="you@example.com" style={{ flex: 1 }} />
            <button className="btn btn-primary">NOTIFY ME</button>
          </form>
        </div>
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', padding: 24, borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--c-muted)', lineHeight: 1.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <I.alert size={14} />
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', fontWeight: 600, color: 'var(--c-text)' }}>CALIFORNIA PROP 65 NOTICE</span>
          </div>
          <p style={{ margin: 0 }}>This product can expose you to chemicals including chromium, which is known to the State of California to cause cancer. For more information, go to <a href="https://www.p65warnings.ca.gov" style={{ color: 'var(--c-text)', textDecoration: 'underline' }}>p65warnings.ca.gov</a>.</p>
        </div>
      </section>
    </main>
  );
}

window.PDPPage = PDPPage;
