// ============================================================
// Stehlen Auto — App Shell (router + state)
// ============================================================
const { I } = window.STEHLEN_UI;
const { Header, Footer } = window.STEHLEN_CHROME;
const { YMMSelector, CartDrawer, SearchOverlay } = window.STEHLEN_OVERLAYS;
// useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect, TweakToggle, TweakButton
// are exposed globally by tweaks-panel.jsx via Object.assign(window, ...)

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "yellow",
  "ymmStyle": "inline",
  "fitmentStyle": "badge",
  "density": "standard",
  "viewport": "desktop",
  "page": "collection",
  "categorySlug": "tonneau-covers",
  "subtypeCode": "T1",
  "vehicleSet": true
}/*EDITMODE-END*/;

const ACCENTS = {
  yellow:  '#f5a823',
  ember:   '#ff6b35',
  signal:  '#22c55e',
  alpine:  '#2563eb',
  brick:   '#dc2626',
  bone:    '#e8e8e8',
};

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [page, setPage] = useState(tweaks.page || 'home');
  const [vehicle, setVehicle] = useState(tweaks.vehicleSet ? { year: '2018', make: 'Ford', model: 'F-150' } : null);
  const [ymmOpen, setYmmOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartLines, setCartLines] = useState(window.STEHLEN_DATA.CART_LINES);

  // Apply accent
  useEffect(() => {
    document.documentElement.style.setProperty('--c-accent', ACCENTS[tweaks.accent] || ACCENTS.yellow);
    document.documentElement.style.setProperty('--c-accent-ink', tweaks.accent === 'bone' ? '#0a0a0a' : (tweaks.accent === 'ember' || tweaks.accent === 'brick' ? '#fff' : '#0a0a0a'));
  }, [tweaks.accent]);

  // Sync vehicleSet
  useEffect(() => {
    if (tweaks.vehicleSet && !vehicle) setVehicle({ year: '2018', make: 'Ford', model: 'F-150' });
    if (!tweaks.vehicleSet && vehicle) setVehicle(null);
  }, [tweaks.vehicleSet]);

  // Sync page from tweaks
  useEffect(() => {
    if (tweaks.page && tweaks.page !== page) setPage(tweaks.page);
  }, [tweaks.page]);

  // Cmd+K opens search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onNav = (p, opts = {}) => {
    if (opts.categorySlug !== undefined) setTweak('categorySlug', opts.categorySlug);
    if (opts.subtypeCode !== undefined) setTweak('subtypeCode', opts.subtypeCode);
    setPage(p);
    setTweak('page', p);
    window.scrollTo(0, 0);
  };

  const handleAddToCart = () => {
    setCartOpen(true);
  };

  const handleSelectVehicle = (v) => {
    setVehicle(v);
    setTweak('vehicleSet', true);
  };

  const mobile = tweaks.viewport === 'mobile';
  const density = tweaks.density;

  // Mobile container = phone frame; Desktop container = full-bleed
  const Frame = ({ children }) => mobile ? (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
      <div style={{
        position: 'relative', width: 390, minHeight: 844,
        background: 'var(--c-bg)',
        border: '8px solid #1a1a1a',
        borderRadius: 36,
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 120, height: 28, background: '#000', borderRadius: '0 0 16px 16px', zIndex: 50,
        }} />
        <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>
    </div>
  ) : (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg)', position: 'relative' }}>{children}</div>
  );

  const cartCount = cartLines.reduce((acc, l) => acc + l.qty, 0);
  const sharedProps = { vehicle, onYMMOpen: () => setYmmOpen(true), onNav, density, mobile };

  return (
    <>
      <Frame>
        <Header
          vehicle={vehicle}
          onYMMOpen={() => setYmmOpen(true)}
          onCartOpen={() => setCartOpen(true)}
          onSearchOpen={() => setSearchOpen(true)}
          onNav={onNav}
          cartCount={cartCount}
          page={page}
          mobile={mobile}
        />
        {page === 'home'       && <window.HomePage {...sharedProps} />}
        {page === 'category'   && <window.CategoryPage {...sharedProps} categorySlug={tweaks.categorySlug || 'roof-racks'} />}
        {page === 'collection' && <window.CollectionPage {...sharedProps} categorySlug={tweaks.categorySlug} subtypeCode={tweaks.subtypeCode} />}
        {page === 'pdp'        && <window.PDPPage {...sharedProps} fitmentStyle={tweaks.fitmentStyle} onAddToCart={handleAddToCart} />}
        {page === 'states'     && <window.StatesCanvas mobile={mobile} />}
        <Footer />

        {/* Mobile bottom Add-to-cart bar on PDP */}
        {mobile && page === 'pdp' && (
          <div style={{ position: 'sticky', bottom: 0, background: 'var(--c-bg)', borderTop: '1px solid var(--c-border)', padding: 12, display: 'flex', gap: 8, zIndex: 30 }}>
            <button className="btn">⚙</button>
            <button onClick={handleAddToCart} className="btn btn-primary" style={{ flex: 1 }}>ADD TO CART · $489.00</button>
          </div>
        )}

        <YMMSelector open={ymmOpen} onClose={() => setYmmOpen(false)} onSelect={handleSelectVehicle} mobile={mobile} variant={tweaks.ymmStyle} />
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} lines={cartLines} onCheckout={() => alert('→ Shopify checkout')} vehicle={vehicle} />
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} onNav={onNav} />
      </Frame>

      {/* Tweaks panel */}
      <TweaksPanel tweaks={tweaks} setTweak={setTweak}>
        <TweakSection title="Navigation">
          <TweakSelect label="Page" value={page} options={[
            { label: 'Home', value: 'home' },
            { label: 'Category landing', value: 'category' },
            { label: 'Collection (results)', value: 'collection' },
            { label: 'PDP', value: 'pdp' },
            { label: 'States', value: 'states' },
          ]} onChange={(v) => { setTweak('page', v); setPage(v); }} />
          {page === 'category' && (
            <TweakSelect label="Category" value={tweaks.categorySlug || 'roof-racks'} options={[
              { label: 'Roof Racks', value: 'roof-racks' },
              { label: 'Tonneau Covers', value: 'tonneau-covers' },
              { label: 'Bumpers', value: 'bumpers' },
              { label: 'Grilles', value: 'grilles' },
            ]} onChange={(v) => setTweak('categorySlug', v)} />
          )}
          <TweakRadio label="Viewport" value={tweaks.viewport} options={[
            { label: 'Desktop', value: 'desktop' },
            { label: 'Mobile',  value: 'mobile' },
          ]} onChange={(v) => setTweak('viewport', v)} />
          <TweakToggle label="Vehicle in garage" value={!!tweaks.vehicleSet} onChange={(v) => setTweak('vehicleSet', v)} />
          <TweakButton label="Open YMM modal"   onClick={() => setYmmOpen(true)} />
          <TweakButton label="Open Cart drawer" onClick={() => setCartOpen(true)} />
        </TweakSection>
        <TweakSection title="Visual">
          <TweakSelect label="Accent color" value={tweaks.accent} options={[
            { label: 'Yellow (brand)', value: 'yellow' },
            { label: 'Ember orange',   value: 'ember' },
            { label: 'Signal green',   value: 'signal' },
            { label: 'Alpine blue',    value: 'alpine' },
            { label: 'Brick red',      value: 'brick' },
            { label: 'Bone (mono)',    value: 'bone' },
          ]} onChange={(v) => setTweak('accent', v)} />
          <TweakRadio label="Density" value={tweaks.density} options={[
            { label: 'Compact',  value: 'compact' },
            { label: 'Standard', value: 'standard' },
            { label: 'Roomy',    value: 'roomy' },
          ]} onChange={(v) => setTweak('density', v)} />
        </TweakSection>
        <TweakSection title="YMM & Fitment">
          <TweakRadio label="YMM style" value={tweaks.ymmStyle} options={[
            { label: 'Inline',   value: 'inline' },
            { label: 'Stepped',  value: 'stepped' },
          ]} onChange={(v) => setTweak('ymmStyle', v)} />
          <TweakRadio label="Fitment signal" value={tweaks.fitmentStyle} options={[
            { label: 'Hero badge', value: 'badge' },
            { label: 'Banner',     value: 'banner' },
            { label: 'Pill',       value: 'pill' },
          ]} onChange={(v) => setTweak('fitmentStyle', v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
