// ============================================================
// Stehlen Auto — Policy Pages (Warranty / Fitment Guarantee)
// Renders different content based on `policy` prop.
// ============================================================
const { I } = window.STEHLEN_UI;

const POLICIES = {
  warranty: {
    eyebrow: 'OUR WARRANTY',
    title: 'LIFETIME WARRANTY.\nNO ASTERISKS.',
    blurb: 'We forge it, weld it, powder-coat it, and stand behind it for as long as you own your truck. If a Stehlen part breaks under normal use, we replace it. That\'s the whole story.',
    pillars: [
      { k: 'LIFETIME', v: 'For the original buyer, on every Stehlen-branded part.' },
      { k: 'NO RECEIPT NEEDED', v: 'We look up your order by email or VIN.' },
      { k: 'NO RESTOCKING', v: 'Defect claims ship a replacement same-day.' },
    ],
    sections: [
      { h: 'WHAT\'S COVERED',
        items: [
          'Material defects (cracks, weld failures, corrosion through powder-coat).',
          'Hardware (bolts, brackets, clamps shipped in the box).',
          'Electronics (LED bed lights, harnesses) for 5 years from purchase.',
          'Powder-coat finish for 5 years against fading and peeling.',
        ]
      },
      { h: 'WHAT\'S NOT',
        items: [
          'Damage from vehicle accidents, off-road impact, or rollovers.',
          'Modifications outside the install instructions (cutting, drilling, welding).',
          'Normal wear: scratches, scuffs, dings from road debris.',
          'Parts purchased used or from non-authorized resellers.',
        ]
      },
      { h: 'HOW TO CLAIM',
        steps: [
          'Email warranty@stehlenauto.com with your order number and a photo.',
          'We respond within one business day with a claim number.',
          'Ship the part back with our prepaid label (or skip — we\'ll often replace without return).',
          'Replacement ships free, anywhere in the lower 48.',
        ],
      },
    ],
  },
  fitment: {
    eyebrow: 'FITMENT GUARANTEE',
    title: 'IT FITS. OR\nWE EAT THE COST.',
    blurb: 'Every Stehlen part is engineered to a specific year/make/model/trim. If our part is listed as fitting your truck and it doesn\'t bolt up, we cover return shipping and refund 100% — including labor reimbursement up to $150.',
    pillars: [
      { k: 'BOLT-ON', v: 'Designed for OEM holes. Zero drilling, ever.' },
      { k: 'TRIM-LEVEL', v: 'Fitment validated to the trim, not just the model.' },
      { k: '$150 LABOR', v: 'Reimbursed if a shop installs and it doesn\'t fit.' },
    ],
    sections: [
      { h: 'HOW WE GUARANTEE FIT',
        items: [
          'Every SKU is mapped to a specific YMM + trim combination by our engineers.',
          'We test every new fitment on a real vehicle in our Corona, CA shop.',
          'We update fitment data when manufacturers mid-cycle change spec — sometimes weekly.',
          'Our YMM selector hides parts that don\'t fit so you can\'t accidentally buy wrong.',
        ]
      },
      { h: 'IF SOMETHING\'S OFF',
        items: [
          'Snap a photo of the issue and email fits@stehlenauto.com.',
          'We\'ll ship a corrected part overnight at our cost.',
          'If it can\'t be made to fit, we refund 100% plus return shipping.',
          'Used a shop? Forward us the install invoice and we reimburse up to $150.',
        ]
      },
      { h: 'WHEN IT DOESN\'T APPLY',
        items: [
          'Aftermarket bumpers, hitches, or body kits already on the truck (we fit OEM).',
          'Vehicles modified outside factory spec (lifted >4", widened track, etc).',
          'Parts purchased from non-authorized resellers.',
        ]
      },
    ],
  },
};

function PolicyPage({ onNav, mobile, policy = 'warranty' }) {
  const p = POLICIES[policy] || POLICIES.warranty;
  const otherKey = policy === 'warranty' ? 'fitment' : 'warranty';

  return (
    <main>
      {/* HERO */}
      <div style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: mobile ? '40px 0 32px' : '72px 0 48px' }}>
          <div className="eyebrow" style={{ marginBottom: 14, color: 'var(--c-accent)' }}>{p.eyebrow}</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 44 : 88, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.9, fontWeight: 800, whiteSpace: 'pre-line' }}>
            {p.title}
          </h1>
          <p style={{ marginTop: 24, fontSize: mobile ? 16 : 18, color: 'var(--c-muted)', lineHeight: 1.7, maxWidth: 720 }}>{p.blurb}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 28, flexWrap: 'wrap' }}>
            <button onClick={() => onNav('contact')} className="btn btn-primary">FILE A CLAIM</button>
            <button onClick={() => onNav(otherKey === 'warranty' ? 'warranty' : 'fitment')} className="btn">SEE {otherKey === 'warranty' ? 'WARRANTY' : 'FITMENT GUARANTEE'} →</button>
          </div>
        </div>
      </div>

      {/* PILLAR STRIP */}
      <div className="container" style={{ padding: mobile ? '32px 0' : '48px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 0, border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
          {p.pillars.map((pl, i) => (
            <div key={pl.k} style={{
              padding: 28,
              background: 'var(--c-surface)',
              borderRight: !mobile && i < 2 ? '1px solid var(--c-border)' : 0,
              borderBottom: mobile && i < 2 ? '1px solid var(--c-border)' : 0,
            }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--c-accent)', fontWeight: 700 }}>{pl.k}</div>
              <div style={{ marginTop: 8, fontSize: 15, color: 'var(--c-muted)', lineHeight: 1.6 }}>{pl.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTIONS */}
      <div className="container" style={{ padding: mobile ? '8px 0 40px' : '16px 0 80px', display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 24 }}>
        {p.sections.map((s, i) => (
          <div key={s.h} style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 24 }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 700, marginBottom: 16, color: i === 1 && policy === 'warranty' ? 'var(--c-danger)' : 'var(--c-text)' }}>{s.h}</div>
            {s.items && (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {s.items.map((it, j) => (
                  <li key={j} style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: 10, fontSize: 14, color: 'var(--c-muted)', lineHeight: 1.6 }}>
                    {i === 1 && policy === 'warranty'
                      ? <I.close size={14} stroke="var(--c-danger)" sw={2.5} />
                      : <I.check size={14} stroke="var(--c-success)" sw={2.5} />}
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            )}
            {s.steps && (
              <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14, counterReset: 'sc' }}>
                {s.steps.map((it, j) => (
                  <li key={j} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 12, fontSize: 14, color: 'var(--c-muted)', lineHeight: 1.6 }}>
                    <span className="mono" style={{ color: 'var(--c-accent)', fontWeight: 700 }}>{(j + 1).toString().padStart(2, '0')}</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ background: 'var(--c-surface)' }}>
        <div className="container" style={{ padding: mobile ? '40px 0' : '64px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>COMMON QUESTIONS</div>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: mobile ? 32 : 44, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 24 }}>The fine print, in plain English.</h2>
          <div style={{ borderTop: '1px solid var(--c-border)' }}>
            {(policy === 'warranty' ? [
              ['Do I need the original receipt?', 'Nope. We look up your order by the email you bought with, or by your truck\'s VIN if you registered it.'],
              ['Is the warranty transferable?', 'Original buyer only. If you sold the truck with the part on it, the new owner is welcome to register it for a 5-year warranty.'],
              ['What about Canadian / Mexican buyers?', 'Same warranty, same process. We ship replacements to Canada free; Mexico requires a small duty fee we\'ll cover up to $25.'],
              ['How fast is replacement?', 'Defect claims ship same business day if filed before 1 PM PT. Otherwise next business day.'],
            ] : [
              ['What counts as a labor reimbursement?', 'Up to $150 of installer labor if a shop installed our part on a vehicle we said it fit. Forward us the invoice and a photo.'],
              ['Does the guarantee cover lifted trucks?', 'Up to a 4-inch lift, yes. Beyond that we\'ll work with you case-by-case.'],
              ['What if I bought from Amazon?', 'Only direct stehlenauto.com purchases qualify for the full guarantee. Amazon orders get standard returns through Amazon.'],
              ['How long do I have to file?', '90 days from delivery. After that we\'ll still help, but the labor reimbursement window closes.'],
            ]).map(([q, a], i) => (
              <details key={i} style={{ borderBottom: '1px solid var(--c-border)', padding: '18px 0' }}>
                <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', listStyle: 'none', fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
                  {q}
                  <I.plus size={14} stroke="var(--c-muted)" />
                </summary>
                <p style={{ marginTop: 12, fontSize: 14, color: 'var(--c-muted)', lineHeight: 1.7, maxWidth: 800 }}>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

window.PolicyPage = PolicyPage;
