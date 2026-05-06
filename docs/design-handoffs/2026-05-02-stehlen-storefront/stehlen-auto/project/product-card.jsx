// ============================================================
// Stehlen Auto — Product Card
// ============================================================
const { I, Stars } = window.STEHLEN_UI;

function ProductCard({ product, density = 'standard', onOpen, vehicle }) {
  const { sku, fitTitle, price, compareAt, image, rating, reviews, badges = [], chips = [], fits } = product;
  const sale = compareAt && compareAt > price;
  const off = sale ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

  return (
    <a className="product-card" href="#" onClick={(e) => { e.preventDefault(); onOpen && onOpen(product); }}
      style={{
        display: 'flex', flexDirection: 'column',
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        position: 'relative',
        transition: 'border-color 140ms ease, transform 140ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--c-border-2)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--c-border)'; }}
    >
      {/* Top badges */}
      <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', zIndex: 2 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {badges.includes('NEW') && <span className="badge badge-new">NEW</span>}
          {badges.includes('SALE') && <span className="badge badge-sale">−{off}%</span>}
          {badges.includes('BEST SELLER') && <span className="badge badge-best">BEST SELLER</span>}
        </div>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} aria-label="Add to wishlist" style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.1)', color: 'var(--c-text)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <I.heart size={13} />
        </button>
      </div>

      {/* Image */}
      <div className="product-img-bg" style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {image ? (
          <img src={image} alt={fitTitle} style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
        ) : (
          <div className="mono" style={{ color: '#999', fontSize: 12, letterSpacing: '0.12em' }}>STEHLEN</div>
        )}
        {/* Fitment ribbon */}
        {vehicle && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '6px 10px',
            background: fits ? 'rgba(34,197,94,0.95)' : 'rgba(239,68,68,0.95)',
            color: fits ? 'var(--c-bg)' : 'var(--c-text)',
          }} className="mono">
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em' }}>
              {fits ? `✓ FITS YOUR ${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}` : `✗ DOES NOT FIT`}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 'var(--pc-pad, 14px)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-gap, 10px)', flex: 1 }}>
        <div className="mono" style={{ fontSize: 9, color: 'var(--c-muted-2)', letterSpacing: '0.12em' }}>{sku}</div>
        <div style={{ fontSize: 13, lineHeight: 1.35, fontWeight: 500, color: 'var(--c-text)', minHeight: density === 'compact' ? 0 : 38 }}>{fitTitle}</div>

        {/* Tag chips */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {chips.map(c => <span key={c} className="chip" style={{ height: 20, padding: '0 7px', fontSize: 9 }}>{c}</span>)}
        </div>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Stars rating={rating} size={11} />
          <span className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.06em' }}>{rating} ({reviews})</span>
        </div>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 'auto' }}>
          <span className="mono" style={{ fontSize: 18, fontWeight: 700 }}>${price.toFixed(0)}</span>
          {sale && <span className="mono" style={{ fontSize: 12, color: 'var(--c-muted)', textDecoration: 'line-through' }}>${compareAt.toFixed(0)}</span>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>or 4× ${(price/4).toFixed(0)} with Affirm</div>
      </div>
    </a>
  );
}

window.ProductCard = ProductCard;
