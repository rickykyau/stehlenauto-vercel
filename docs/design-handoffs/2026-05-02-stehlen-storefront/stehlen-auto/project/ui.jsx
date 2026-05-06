// ============================================================
// Stehlen Auto — shared UI primitives + icons
// ============================================================
const { useState, useEffect, useRef, useMemo } = React;

// ---------- Icons (single 16px stroke unless noted) ----------
const Icon = ({ d, size = 16, fill = 'none', stroke = 'currentColor', sw = 1.5, viewBox = '0 0 24 24', children }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d ? <path d={d} /> : children}
  </svg>
);
const I = {
  search:    (p) => <Icon {...p} d="M21 21l-4.3-4.3M19 11a8 8 0 11-16 0 8 8 0 0116 0z" />,
  user:      (p) => <Icon {...p} d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M16 7a4 4 0 11-8 0 4 4 0 018 0z" />,
  cart:      (p) => <Icon {...p} d="M3 3h2l2.4 12.3a2 2 0 002 1.7h8.7a2 2 0 002-1.6L22 8H6M9 21a1 1 0 100-2 1 1 0 000 2zM20 21a1 1 0 100-2 1 1 0 000 2z" />,
  garage:    (p) => <Icon {...p} d="M3 21V8l9-5 9 5v13M9 21v-7h6v7M3 12h18" />,
  chevDown:  (p) => <Icon {...p} d="M6 9l6 6 6-6" />,
  chevRight: (p) => <Icon {...p} d="M9 6l6 6-6 6" />,
  chevLeft:  (p) => <Icon {...p} d="M15 6l-6 6 6 6" />,
  chevUp:    (p) => <Icon {...p} d="M18 15l-6-6-6 6" />,
  close:     (p) => <Icon {...p} d="M18 6L6 18M6 6l12 12" />,
  check:     (p) => <Icon {...p} d="M20 6L9 17l-5-5" />,
  plus:      (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  minus:     (p) => <Icon {...p} d="M5 12h14" />,
  menu:      (p) => <Icon {...p} d="M3 6h18M3 12h18M3 18h18" />,
  truck:     (p) => <Icon {...p} d="M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />,
  shield:    (p) => <Icon {...p} d="M12 2l9 4v6c0 5-3.5 9-9 10-5.5-1-9-5-9-10V6l9-4z" />,
  shipping:  (p) => <Icon {...p} d="M3 7h11v10H3zM14 10h4l3 3v4h-7M7 21a2 2 0 100-4 2 2 0 000 4zM18 21a2 2 0 100-4 2 2 0 000 4z" />,
  return:    (p) => <Icon {...p} d="M3 12a9 9 0 1015-6.7L21 8M21 3v5h-5" />,
  star:      (p) => <Icon {...p} d="M12 2l3.1 6.3 7 1-5 4.9 1.2 6.9L12 17.8l-6.3 3.3 1.2-6.9-5-4.9 7-1z" fill="currentColor" stroke="none" />,
  starOutline:(p)=> <Icon {...p} d="M12 2l3.1 6.3 7 1-5 4.9 1.2 6.9L12 17.8l-6.3 3.3 1.2-6.9-5-4.9 7-1z" />,
  heart:     (p) => <Icon {...p} d="M20.84 4.6a5.5 5.5 0 00-7.78 0L12 5.66l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
  filter:    (p) => <Icon {...p} d="M4 6h16M7 12h10M10 18h4" />,
  grid:      (p) => <Icon {...p} d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />,
  list:      (p) => <Icon {...p} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  phone:     (p) => <Icon {...p} d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.7A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8 9.6a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z" />,
  chat:      (p) => <Icon {...p} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
  share:     (p) => <Icon {...p} d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />,
  wrench:    (p) => <Icon {...p} d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 005.4-5.4l-2.7 2.7-2.6-2.6 2.7-2.7z" />,
  zap:       (p) => <Icon {...p} d="M13 2L3 14h9l-1 8 10-12h-9z" fill="currentColor" stroke="none" />,
  alert:     (p) => <Icon {...p} d="M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />,
  arrowR:    (p) => <Icon {...p} d="M5 12h14M13 5l7 7-7 7" />,
  flame:     (p) => <Icon {...p} d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.4-.5-2-1-3-1.2-2.3-.5-4.5 1-6 0 4 4 5 4 9a4 4 0 11-8 0c0-1 0-2 .5-3" />,
  external:  (p) => <Icon {...p} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />,
  trash:     (p) => <Icon {...p} d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />,
};

// ---------- Stars ----------
function Stars({ rating = 5, size = 12 }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[0,1,2,3,4].map(i => (
        <span key={i} style={{ color: i < full || (i === full && half) ? 'var(--c-accent)' : 'var(--c-border-2)', display: 'inline-flex' }}>
          <I.star size={size} />
        </span>
      ))}
    </span>
  );
}

// ---------- Logo ----------
function Logo({ height = 28 }) {
  return <img src="assets/stehlen-logo.png" alt="Stehlen" style={{ height, width: 'auto' }} />;
}

// ---------- Spec row (key:value with hairline) ----------
function SpecRow({ label, value, mono = true }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, padding: '10px 0', borderBottom: '1px solid var(--c-border)', fontSize: 13 }}>
      <span style={{ color: 'var(--c-muted)', fontFamily: 'var(--f-display)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      <span style={{ fontFamily: mono ? 'var(--f-display)' : 'var(--f-body)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

// ---------- Trust row ----------
function TrustRow({ vertical = false, condensed = false }) {
  const items = [
    { icon: <I.shipping size={18} />, head: 'FREE SHIPPING',     sub: 'On orders $99+ to 48 states' },
    { icon: <I.shield   size={18} />, head: 'FITMENT GUARANTEED',sub: 'Or your money back' },
    { icon: <I.return   size={18} />, head: '30-DAY RETURNS',    sub: 'Hassle-free, US-based' },
    { icon: <I.truck    size={18} />, head: '300,000+ CUSTOMERS',sub: '10+ years selling parts' },
  ];
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: vertical ? '1fr' : 'repeat(4, 1fr)',
      borderTop: '1px solid var(--c-border)',
      borderBottom: '1px solid var(--c-border)',
    }}>
      {items.map((it, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: condensed ? '14px 18px' : '20px 24px',
          borderRight: !vertical && i < items.length - 1 ? '1px solid var(--c-border)' : '0',
          borderBottom: vertical && i < items.length - 1 ? '1px solid var(--c-border)' : '0',
        }}>
          <div style={{ color: 'var(--c-accent)', flexShrink: 0 }}>{it.icon}</div>
          <div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', fontWeight: 600 }}>{it.head}</div>
            <div style={{ color: 'var(--c-muted)', fontSize: 12, marginTop: 2 }}>{it.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Vehicle pill (current YMM) ----------
function VehiclePill({ vehicle, onChange, compact = false }) {
  if (!vehicle) {
    return (
      <button onClick={onChange} className="btn" style={{ height: compact ? 32 : 36, fontSize: 11, padding: '0 12px', gap: 6 }}>
        <I.truck size={14} />
        <span>SELECT VEHICLE</span>
      </button>
    );
  }
  return (
    <button onClick={onChange} style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      height: compact ? 32 : 36, padding: '0 6px 0 12px',
      background: 'var(--c-surface-2)', border: '1px solid var(--c-border)',
      borderRadius: 'var(--r-md)', cursor: 'pointer', color: 'var(--c-text)',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c-success)', flexShrink: 0 }} />
      <span className="mono" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
        {vehicle.year} {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()}
      </span>
      <span style={{ display: 'inline-flex', height: 24, width: 24, alignItems: 'center', justifyContent: 'center', background: 'var(--c-surface-3)', borderRadius: 2 }}>
        <I.chevDown size={12} />
      </span>
    </button>
  );
}

// ---------- Generic Modal ----------
function Modal({ open, onClose, children, width = 520, title, mobile = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;

  if (mobile) {
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end',
      }} onClick={onClose}>
        <div className="anim-slide-up" onClick={(e) => e.stopPropagation()} style={{
          width: '100%',
          background: 'var(--c-surface)',
          borderTop: '1px solid var(--c-border)',
          borderRadius: '12px 12px 0 0',
          maxHeight: '92%',
          overflowY: 'auto',
        }}>
          {title && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--c-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 36, height: 4, background: 'var(--c-border-2)', borderRadius: 2, position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)' }} />
                <h3 className="mono" style={{ fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{title}</h3>
              </div>
              <button onClick={onClose} className="btn-ghost" style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--c-muted)', display: 'flex' }}>
                <I.close size={18} />
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="anim-fade-in" style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: width,
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-lg)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--c-border)' }}>
            <h3 className="mono" style={{ fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{title}</h3>
            <button onClick={onClose} style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--c-muted)', display: 'flex' }}>
              <I.close size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

window.STEHLEN_UI = { I, Icon, Stars, Logo, SpecRow, TrustRow, VehiclePill, Modal };
