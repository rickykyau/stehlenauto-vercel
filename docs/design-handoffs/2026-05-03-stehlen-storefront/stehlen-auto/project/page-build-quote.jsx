// ============================================================
// Stehlen Auto — Build & Quote (Bundle Builder)
// ============================================================
const { I, Stars } = window.STEHLEN_UI;

function BuildQuotePage({ onNav, vehicle, onYMMOpen, mobile }) {
  const [step, setStep] = useState(1);
  const [pkg, setPkg] = useState('overland');
  const [picks, setPicks] = useState({ rack: 'r-pro', tonneau: 't-roll', lights: true, bumper: false, grille: true, mats: true });
  const [installAdd, setInstallAdd] = useState(false);

  const ITEMS = {
    rack:    { label: 'Roof Rack',     options: [['r-base', 'Base Crossbars', 289], ['r-pro', 'Pro Modular Rack', 489], ['r-elite', 'Elite Cargo + Light Rail', 689]] },
    tonneau: { label: 'Tonneau Cover', options: [['t-roll', 'Lock & Roll-Up', 449], ['t-snap', 'Hidden Snap', 379], ['t-flash','Flash Roll-Up', 619]] },
  };
  const ADDONS = [
    { id: 'lights', label: 'LED Bed Lights',  price: 129, sub: 'Surgical white. 2hr install.' },
    { id: 'bumper', label: 'Modular Bumper',  price: 749, sub: 'Steel. Class IV recovery.' },
    { id: 'grille', label: 'Mesh Grille',     price: 219, sub: 'Light-bar ready cutout.' },
    { id: 'mats',   label: 'Bed Mat (rubber)',price: 89,  sub: 'Cut-to-fit. Anti-slip.' },
  ];

  const subtotal =
    (ITEMS.rack.options.find(o => o[0] === picks.rack)?.[2] || 0) +
    (ITEMS.tonneau.options.find(o => o[0] === picks.tonneau)?.[2] || 0) +
    ADDONS.filter(a => picks[a.id]).reduce((s, a) => s + a.price, 0);
  const bundleDiscount = subtotal * 0.12;
  const install = installAdd ? 199 : 0;
  const total = subtotal - bundleDiscount + install;

  return (
    <main>
      <div style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile ? '32px 0' : '56px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 14, color: 'var(--c-accent)' }}>BUILD & QUOTE</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 44 : 84, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.9, fontWeight: 800 }}>
            CONFIGURE YOUR<br/><span style={{ color: 'var(--c-accent)' }}>RIG.</span>
          </h1>
          <p style={{ marginTop: 20, fontSize: 17, color: 'var(--c-muted)', maxWidth: 640, lineHeight: 1.65 }}>
            Pick a starting package, swap parts, drop add-ons. We bundle the discount automatically.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: mobile ? '24px 0' : '40px 0', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 380px', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* vehicle */}
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--c-muted)', fontWeight: 600 }}>BUILDING FOR</div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 700, marginTop: 4 }}>{vehicle ? `${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}` : 'NO VEHICLE SET'}</div>
            </div>
            <button onClick={onYMMOpen} className="btn btn-sm">CHANGE</button>
          </div>

          {/* package picker */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>1 — PICK A STARTING PACKAGE</div>
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { id: 'overland', t: 'OVERLAND',  s: 'Roof rack + tonneau + bed mat. Long weekends, fully loaded.', from: 1029, parts: 3 },
                { id: 'work',     t: 'WORK',      s: 'Heavy-duty bumper + LED bed lights + tonneau. Job site ready.', from: 1289, parts: 3 },
                { id: 'street',   t: 'STREET',    s: 'Mesh grille + flush tonneau. Daily-driver clean look.', from: 819, parts: 2 },
              ].map(p => {
                const sel = pkg === p.id;
                return (
                  <button key={p.id} onClick={() => setPkg(p.id)} style={{
                    textAlign: 'left', padding: 18,
                    background: sel ? 'var(--c-bg)' : 'var(--c-surface)',
                    border: `1px solid ${sel ? 'var(--c-accent)' : 'var(--c-border)'}`,
                    borderRadius: 'var(--r-md)', color: 'var(--c-text)', cursor: 'pointer', position: 'relative',
                  }}>
                    {sel && <span style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: '50%', background: 'var(--c-accent)', color: 'var(--c-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.check size={12} stroke="var(--c-bg)" sw={3} /></span>}
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>{p.t}</div>
                    <p style={{ fontSize: 13, color: 'var(--c-muted)', lineHeight: 1.55, marginTop: 6 }}>{p.s}</p>
                    <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--c-muted-2)', letterSpacing: '0.1em' }}>FROM</span>
                      <span className="mono" style={{ fontSize: 18, fontWeight: 700 }}>${p.from}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* core swappers */}
          {Object.entries(ITEMS).map(([k, def]) => (
            <div key={k}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>SWAP — {def.label.toUpperCase()}</div>
              <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 8 }}>
                {def.options.map(([id, name, price]) => {
                  const sel = picks[k] === id;
                  return (
                    <button key={id} onClick={() => setPicks(p => ({ ...p, [k]: id }))} style={{
                      textAlign: 'left', padding: 14,
                      background: sel ? 'rgba(245,168,35,0.08)' : 'var(--c-surface)',
                      border: `1px solid ${sel ? 'var(--c-accent)' : 'var(--c-border)'}`,
                      borderRadius: 'var(--r-md)', color: 'var(--c-text)', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                        <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.06em', marginTop: 2 }}>${price}</div>
                      </div>
                      <span style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${sel ? 'var(--c-accent)' : 'var(--c-border-2)'}`, background: sel ? 'var(--c-accent)' : 'transparent' }} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* add-ons */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>ADD-ONS</div>
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 8 }}>
              {ADDONS.map(a => {
                const sel = picks[a.id];
                return (
                  <button key={a.id} onClick={() => setPicks(p => ({ ...p, [a.id]: !sel }))} style={{
                    textAlign: 'left', padding: 14,
                    background: sel ? 'rgba(245,168,35,0.08)' : 'var(--c-surface)',
                    border: `1px solid ${sel ? 'var(--c-accent)' : 'var(--c-border)'}`,
                    borderRadius: 'var(--r-md)', color: 'var(--c-text)', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{a.label} <span className="mono" style={{ color: 'var(--c-muted)', fontWeight: 500, fontSize: 12 }}>+${a.price}</span></div>
                      <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{a.sub}</div>
                    </div>
                    <span style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${sel ? 'var(--c-accent)' : 'var(--c-border-2)'}`, background: sel ? 'var(--c-accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {sel && <I.check size={12} stroke="var(--c-bg)" sw={3}/>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* install */}
          <label style={{ display: 'flex', gap: 14, padding: 18, background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', cursor: 'pointer', alignItems: 'center' }}>
            <input type="checkbox" checked={installAdd} onChange={(e) => setInstallAdd(e.target.checked)} style={{ accentColor: 'var(--c-accent)', width: 18, height: 18 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Add pro install at a Stehlen-certified shop near you <span className="mono" style={{ fontWeight: 500, color: 'var(--c-muted)' }}>+$199</span></div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>120+ partner shops nationwide. Most builds done in 90 min.</div>
            </div>
          </label>
        </div>

        {/* sticky quote */}
        <div style={{ alignSelf: 'flex-start', position: mobile ? 'static' : 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 700 }}>YOUR BUILD · {pkg.toUpperCase()}</div>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(ITEMS).map(([k, def]) => {
                const o = def.options.find(o => o[0] === picks[k]);
                return o && (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--c-muted)' }}>{def.label}: <strong style={{ color: 'var(--c-text)' }}>{o[1]}</strong></span>
                    <span className="mono">${o[2]}</span>
                  </div>
                );
              })}
              {ADDONS.filter(a => picks[a.id]).map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--c-muted)' }}>+ {a.label}</span>
                  <span className="mono">${a.price}</span>
                </div>
              ))}
              {installAdd && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--c-muted)' }}>+ Pro install</span>
                  <span className="mono">$199</span>
                </div>
              )}
            </div>
            <div style={{ padding: 16, borderTop: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} muted />
              <Row label="Bundle discount (12%)" value={`-$${bundleDiscount.toFixed(2)}`} success />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 10, marginTop: 4, borderTop: '1px solid var(--c-border)' }}>
                <span className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', fontWeight: 700 }}>QUOTE</span>
                <span className="mono" style={{ fontSize: 24, fontWeight: 700 }}>${total.toFixed(2)}</span>
              </div>
            </div>
            <div style={{ padding: 16, paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={() => onNav('cart')} className="btn btn-primary btn-block btn-lg">ADD BUILD TO CART</button>
              <button className="btn btn-block">EMAIL ME THIS QUOTE</button>
              <button className="btn btn-block">FINANCE FROM ${(total / 12).toFixed(0)}/MO</button>
            </div>
          </div>
          <div style={{ padding: 14, background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--c-muted)', lineHeight: 1.6 }}>
            <I.shield size={12} stroke="var(--c-success)" /> Bundle discount is automatic. Lifetime warranty applies to every part. Quote good 30 days.
          </div>
        </div>
      </div>
    </main>
  );
}
function Row({ label, value, success, muted }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
    <span style={{ color: muted ? 'var(--c-muted)' : 'var(--c-text)' }}>{label}</span>
    <span className="mono" style={{ color: success ? 'var(--c-success)' : 'var(--c-text)', fontWeight: 600 }}>{value}</span>
  </div>;
}
window.BuildQuotePage = BuildQuotePage;
