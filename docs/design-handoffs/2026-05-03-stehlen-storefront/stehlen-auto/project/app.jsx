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
        {page === 'home'               && <window.HomePage {...sharedProps} />}
        {page === 'category'           && <window.CategoryPage {...sharedProps} categorySlug={tweaks.categorySlug || 'roof-racks'} />}
        {page === 'collection'         && <window.CollectionPage {...sharedProps} categorySlug={tweaks.categorySlug} subtypeCode={tweaks.subtypeCode} />}
        {page === 'pdp'                && <window.PDPPage {...sharedProps} fitmentStyle={tweaks.fitmentStyle} onAddToCart={handleAddToCart} />}
        {page === 'cart'               && <window.CartPage {...sharedProps} />}
        {page === 'checkout'           && <window.CheckoutPage {...sharedProps} />}
        {page === 'order-confirmation' && <window.OrderConfirmationPage {...sharedProps} />}
        {page === 'account'            && <window.AccountPage {...sharedProps} />}
        {page === 'about'              && <window.AboutPage {...sharedProps} />}
        {page === 'support'            && <window.SupportPage {...sharedProps} />}
        {page === 'states'             && <window.StatesCanvas mobile={mobile} />}
        {page === 'order-detail'       && <window.OrderDetailPage {...sharedProps} />}
        {page === 'returns'            && <window.ReturnsPage {...sharedProps} />}
        {page === 'search'             && <window.SearchResultsPage {...sharedProps} />}
        {page === 'auth'               && <window.AuthPage {...sharedProps} />}
        {page === 'vehicle-hub'        && <window.VehicleHubPage {...sharedProps} />}
        {page === 'install-guide'      && <window.InstallGuidePage {...sharedProps} />}
        {page === 'warranty'           && <window.PolicyPage {...sharedProps} policy="warranty" />}
        {page === 'fitment'            && <window.PolicyPage {...sharedProps} policy="fitment" />}
        {page === 'contact'            && <window.ContactPage {...sharedProps} />}
        {page === 'build'              && <window.BuildQuotePage {...sharedProps} />}
        {page === 'orders'             && <window.OrderHistoryPage {...sharedProps} />}
        {page === 'wishlist'           && <window.WishlistPage {...sharedProps} />}
        {page === 'compare'            && <window.ComparePage {...sharedProps} />}
        {page === 'write-review'       && <window.WriteReviewPage {...sharedProps} />}
        {page === 'loyalty'            && <window.LoyaltyPage {...sharedProps} />}
        {page === 'refer'              && <window.ReferPage {...sharedProps} />}
        {page === 'gift-card'          && <window.GiftCardPage {...sharedProps} />}
        {page === 'garage-detail'      && <window.GarageDetailPage {...sharedProps} />}
        {page === 'blog'               && <window.BlogIndexPage {...sharedProps} />}
        {page === 'article'            && <window.ArticlePage {...sharedProps} />}
        {page === 'guides'             && <window.BuyersGuideHubPage {...sharedProps} />}
        {page === 'press'              && <window.PressPage {...sharedProps} />}
        {page === 'careers'            && <window.CareersPage {...sharedProps} />}
        {page === 'dealers'            && <window.DealersPage {...sharedProps} />}
        {page === 'affiliate'          && <window.AffiliatePage {...sharedProps} />}
        {page === 'privacy'            && <window.PrivacyPage {...sharedProps} />}
        {page === 'terms'              && <window.TermsPage {...sharedProps} />}
        {page === 'accessibility'      && <window.AccessibilityPage {...sharedProps} />}
        {page === 'shipping-policy'    && <window.ShippingPolicyPage {...sharedProps} />}
        {page === 'prop65'             && <window.Prop65Page {...sharedProps} />}
        {page === '404'                && <window.NotFoundPage {...sharedProps} />}
        {page === 'sitemap'            && <window.SitemapPage {...sharedProps} />}
        {page === 'promo'              && <window.PromoPage {...sharedProps} />}
        {page === 'newsletter'         && <window.NewsletterPrefsPage {...sharedProps} />}
        {page === 'addresses'          && <window.AccountSubPage {...sharedProps} kind="addresses" />}
        {page === 'payment'            && <window.AccountSubPage {...sharedProps} kind="payment" />}
        {page === 'notifications'      && <window.AccountSubPage {...sharedProps} kind="notifications" />}
        {page === 'guest-track'        && <window.GuestTrackPage {...sharedProps} />}
        {page === 'quick-order'        && <window.QuickOrderPage {...sharedProps} />}
        {page !== 'checkout' && page !== 'auth' && page !== 'returns' && <Footer />}

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
        <window.ChatAssistant vehicle={vehicle} onNav={onNav} mobile={mobile} />
      </Frame>

      {/* Tweaks panel */}
      <TweaksPanel tweaks={tweaks} setTweak={setTweak}>
        <TweakSection title="Navigation">
          <TweakSelect label="Page" value={page} options={[
            { label: 'Home', value: 'home' },
            { label: 'Category landing', value: 'category' },
            { label: 'Collection (results)', value: 'collection' },
            { label: 'PDP', value: 'pdp' },
            { label: 'Cart (full page)', value: 'cart' },
            { label: 'Checkout', value: 'checkout' },
            { label: 'Order confirmation', value: 'order-confirmation' },
            { label: 'Account / Garage', value: 'account' },
            { label: 'About', value: 'about' },
            { label: 'Support', value: 'support' },
            { label: 'Order detail / tracking', value: 'order-detail' },
            { label: 'Returns flow',             value: 'returns' },
            { label: 'Search results',           value: 'search' },
            { label: 'Sign in / Create acct',    value: 'auth' },
            { label: 'Vehicle hub',              value: 'vehicle-hub' },
            { label: 'Install guide',            value: 'install-guide' },
            { label: 'Warranty policy',          value: 'warranty' },
            { label: 'Fitment guarantee',        value: 'fitment' },
            { label: 'Contact us',               value: 'contact' },
            { label: '— Commerce —',             value: '__sep1', disabled: true },
            { label: 'Build & Quote',            value: 'build' },
            { label: 'Compare products',         value: 'compare' },
            { label: 'Quick order (bulk SKU)',   value: 'quick-order' },
            { label: 'Promo landing',            value: 'promo' },
            { label: 'Gift card',                value: 'gift-card' },
            { label: '— Account —',              value: '__sep2', disabled: true },
            { label: 'Order history',            value: 'orders' },
            { label: 'Wishlist',                 value: 'wishlist' },
            { label: 'Loyalty / Rewards',        value: 'loyalty' },
            { label: 'Refer a friend',           value: 'refer' },
            { label: 'Garage — vehicle detail',  value: 'garage-detail' },
            { label: 'Write a review',           value: 'write-review' },
            { label: 'Addresses',                value: 'addresses' },
            { label: 'Payment methods',          value: 'payment' },
            { label: 'Notification prefs',       value: 'notifications' },
            { label: 'Newsletter prefs',         value: 'newsletter' },
            { label: 'Guest track order',        value: 'guest-track' },
            { label: '— Content —',              value: '__sep3', disabled: true },
            { label: 'Journal index',            value: 'blog' },
            { label: 'Article (single)',         value: 'article' },
            { label: 'Buyer\'s guides hub',      value: 'guides' },
            { label: '— Company —',              value: '__sep4', disabled: true },
            { label: 'Press',                    value: 'press' },
            { label: 'Careers',                  value: 'careers' },
            { label: 'Become a dealer (B2B)',    value: 'dealers' },
            { label: 'Affiliate program',        value: 'affiliate' },
            { label: '— Legal & utility —',      value: '__sep5', disabled: true },
            { label: 'Privacy policy',           value: 'privacy' },
            { label: 'Terms of service',         value: 'terms' },
            { label: 'Accessibility',            value: 'accessibility' },
            { label: 'Shipping policy',          value: 'shipping-policy' },
            { label: 'Prop 65 disclosure',       value: 'prop65' },
            { label: 'Sitemap',                  value: 'sitemap' },
            { label: '404 / not found',          value: '404' },
            { label: 'States canvas',            value: 'states' },
          ]} onChange={(v) => { if (v.startsWith('__sep')) return; setTweak('page', v); setPage(v); }} />
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
          <TweakButton label="View full Cart page" onClick={() => onNav('cart')} />
          <TweakButton label="Run checkout flow"   onClick={() => onNav('checkout')} />
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
