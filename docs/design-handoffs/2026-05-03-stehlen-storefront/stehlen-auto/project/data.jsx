// ============================================================
// Stehlen Auto — catalog data
// ============================================================

const CATEGORIES = [
  { slug: 'roof-racks', name: 'Roof Racks', count: 142, image: 'assets/product-roof-rack.webp' },
  { slug: 'grilles', name: 'Grilles', count: 218, image: 'assets/product-grille.webp' },
  { slug: 'bed-lights', name: 'Bed Lighting', count: 64, image: 'assets/product-bed-lights.webp' },
  { slug: 'bumpers', name: 'Bumpers & Guards', count: 187, image: 'assets/bumper-modular.jpg' },
  { slug: 'fender-flares', name: 'Fender Flares', count: 156, image: null },
  { slug: 'running-boards', name: 'Running Boards', count: 121, image: null },
  { slug: 'tonneau-covers', name: 'Tonneau Covers', count: 98, image: 'assets/product-tonneau-cover.jpg' },
  { slug: 'hitches', name: 'Hitches & Towing', count: 89, image: null },
  { slug: 'bed-mats', name: 'Bed Mats & Liners', count: 67, image: null },
  { slug: 'sport-bars', name: 'Sport Bars', count: 54, image: null },
  { slug: 'tail-lights', name: 'Tail Lights', count: 78, image: null },
  { slug: 'recovery', name: 'Recovery Gear', count: 48, image: null },
];

const POPULAR_VEHICLES = [
  { make: 'Ford',     model: 'F-150',    years: '2015–2026', count: 312 },
  { make: 'Chevrolet',model: 'Silverado',years: '2014–2026', count: 287 },
  { make: 'Ram',      model: '1500',     years: '2009–2026', count: 241 },
  { make: 'Toyota',   model: 'Tacoma',   years: '2016–2026', count: 198 },
  { make: 'Jeep',     model: 'Wrangler', years: '2007–2026', count: 174 },
  { make: 'Toyota',   model: 'Tundra',   years: '2007–2026', count: 156 },
  { make: 'GMC',      model: 'Sierra',   years: '2014–2026', count: 143 },
  { make: 'Nissan',   model: 'Frontier', years: '2005–2026', count: 89  },
];

// 12 products in roof racks collection
const PRODUCTS = [
  {
    sku: 'RR-LP-UNI-STL-2', upc: '816239022001',
    title: 'Stehlen Universal Door-Frame Mount Roof Rack',
    fitTitle: 'Stehlen Door-Frame Mount Roof Rack | Fits 2014–2026 Ford F-150 / SuperCrew',
    price: 489, compareAt: 549,
    image: 'assets/product-roof-rack.webp',
    rating: 4.7, reviews: 128,
    badges: ['BEST SELLER'],
    chips: ['BLACK', 'STEEL', 'CREW CAB'],
    category: 'roof-racks',
    fits: true,
    inventory: 47,
  },
  {
    sku: 'RR-LP-UNI-STL-3', upc: '816239022002',
    title: 'Stehlen Low-Profile Roof Rack',
    fitTitle: 'Stehlen Low-Profile Aluminum Roof Rack | Fits 2014–2026 Ford F-150 / SuperCrew',
    price: 559, compareAt: null,
    image: 'assets/product-roof-rack.webp',
    rating: 4.8, reviews: 92,
    badges: ['NEW'],
    chips: ['BLACK', 'ALUMINUM', '5\' BED'],
    category: 'roof-racks',
    fits: true,
    inventory: 22,
  },
  {
    sku: 'RR-HD-CRW-STL-1', upc: '816239022003',
    title: 'Stehlen Heavy-Duty Crossbar Set',
    fitTitle: 'Stehlen Heavy-Duty Steel Crossbar Set | Fits 2018–2026 Ford F-150 / Crew',
    price: 329, compareAt: 379,
    image: 'assets/product-roof-rack.webp',
    rating: 4.6, reviews: 67,
    badges: ['SALE'],
    chips: ['BLACK', 'STEEL'],
    category: 'roof-racks',
    fits: true,
    inventory: 89,
  },
  {
    sku: 'RR-MOD-OVR-STL-1', upc: '816239022004',
    title: 'Stehlen Modular Overland Rack',
    fitTitle: 'Stehlen Modular Overland Rack | Fits 2015–2026 Ford F-150 / 6.5\' Bed',
    price: 729, compareAt: null,
    image: 'assets/product-roof-rack.webp',
    rating: 4.9, reviews: 41,
    badges: [],
    chips: ['BLACK', 'STEEL', '6.5\' BED'],
    category: 'roof-racks',
    fits: true,
    inventory: 12,
  },
  {
    sku: 'RR-CGO-LRG-STL-1', upc: '816239022005',
    title: 'Stehlen Cargo Roof Basket',
    fitTitle: 'Stehlen Cargo Roof Basket | Universal Fit',
    price: 219, compareAt: 259,
    image: 'assets/product-roof-rack.webp',
    rating: 4.4, reviews: 215,
    badges: ['BEST SELLER'],
    chips: ['BLACK', 'STEEL', 'UNIVERSAL'],
    category: 'roof-racks',
    fits: false, // universal but flagged separately
    inventory: 142,
  },
  {
    sku: 'RR-LP-UNI-STL-4', upc: '816239022006',
    title: 'Stehlen Adventure Roof Platform',
    fitTitle: 'Stehlen Adventure Roof Platform | Fits 2009–2018 Ford F-150',
    price: 619, compareAt: null,
    image: 'assets/product-roof-rack.webp',
    rating: 4.7, reviews: 58,
    badges: [],
    chips: ['BLACK', 'STEEL', 'EXTENDED CAB'],
    category: 'roof-racks',
    fits: false, // doesn't fit selected vehicle
    inventory: 34,
  },
  {
    sku: 'RR-RUG-XLT-STL-1', upc: '816239022007',
    title: 'Stehlen Rugged Roof Cargo Rack',
    fitTitle: 'Stehlen Rugged Cargo Roof Rack | Fits 2015–2026 Ford F-150 / SuperCab',
    price: 449, compareAt: null,
    image: 'assets/product-roof-rack.webp',
    rating: 4.5, reviews: 73,
    badges: [],
    chips: ['BLACK', 'STEEL', 'SUPERCAB'],
    category: 'roof-racks',
    fits: true,
    inventory: 28,
  },
  {
    sku: 'RR-FLT-FLT-STL-1', upc: '816239022008',
    title: 'Stehlen Flat Top Roof Rack',
    fitTitle: 'Stehlen Flat Top Roof Rack | Fits 2014–2026 Ford F-150 / All Cabs',
    price: 389, compareAt: 439,
    image: 'assets/product-roof-rack.webp',
    rating: 4.6, reviews: 104,
    badges: ['SALE'],
    chips: ['BLACK', 'ALUMINUM'],
    category: 'roof-racks',
    fits: true,
    inventory: 56,
  },
  {
    sku: 'RR-EXP-DLX-STL-1', upc: '816239022009',
    title: 'Stehlen Expedition Deluxe Rack',
    fitTitle: 'Stehlen Expedition Deluxe Rack System | Fits 2017–2026 Ford F-150',
    price: 899, compareAt: 999,
    image: 'assets/product-roof-rack.webp',
    rating: 4.9, reviews: 32,
    badges: ['NEW', 'SALE'],
    chips: ['BLACK', 'STEEL', '5.5\' BED'],
    category: 'roof-racks',
    fits: true,
    inventory: 8,
  },
  {
    sku: 'RR-PRO-MTL-STL-1', upc: '816239022010',
    title: 'Stehlen Pro Metal Roof Rack',
    fitTitle: 'Stehlen Pro Metal Roof Rack | Fits 2015–2026 Ford F-150',
    price: 519, compareAt: null,
    image: 'assets/product-roof-rack.webp',
    rating: 4.5, reviews: 87,
    badges: [],
    chips: ['BLACK', 'STEEL'],
    category: 'roof-racks',
    fits: true,
    inventory: 41,
  },
  {
    sku: 'RR-MIN-CMP-STL-1', upc: '816239022011',
    title: 'Stehlen Minimalist Roof Rack',
    fitTitle: 'Stehlen Minimalist Compact Roof Rack | Fits 2009–2014 Ford F-150',
    price: 269, compareAt: null,
    image: 'assets/product-roof-rack.webp',
    rating: 4.3, reviews: 64,
    badges: [],
    chips: ['BLACK', 'ALUMINUM', 'REGULAR CAB'],
    category: 'roof-racks',
    fits: false, // older years
    inventory: 73,
  },
  {
    sku: 'RR-OVR-LND-STL-2', upc: '816239022012',
    title: 'Stehlen Overland Tactical Rack',
    fitTitle: 'Stehlen Overland Tactical Rack | Fits 2015–2026 Ford F-150 / Crew',
    price: 759, compareAt: null,
    image: 'assets/product-roof-rack.webp',
    rating: 4.8, reviews: 51,
    badges: [],
    chips: ['BLACK', 'STEEL', 'CREW CAB'],
    category: 'roof-racks',
    fits: true,
    inventory: 19,
  },
];

const ACTIVE_PRODUCT = PRODUCTS[0]; // PDP target

const RECENTLY_VIEWED = PRODUCTS.slice(2, 6);

const CART_LINES = [
  { sku: 'RR-LP-UNI-STL-2', title: 'Stehlen Door-Frame Mount Roof Rack', subtitle: 'Black / Steel / Crew Cab', price: 489, qty: 1, image: 'assets/product-roof-rack.webp', fitFor: '2018 Ford F-150' },
  { sku: 'GR-TOR03-H-BK',   title: 'Stehlen Horizontal Style Grille',     subtitle: 'Gloss Black / Horizontal',  price: 219, qty: 1, image: 'assets/product-grille.webp',    fitFor: '2018 Ford F-150' },
];

const REVIEWS = [
  { name: 'Mike R.', date: 'Apr 14, 2026', rating: 5, vehicle: '2019 Ford F-150 SuperCrew', title: 'Bombproof construction',
    body: 'Installed in about 90 minutes with a buddy. Powder coat is thick, mounting hardware is grade-8. Hauled two kayaks across Nevada at 80mph and the rack didn\'t shift a millimeter. Worth every penny.' },
  { name: 'Dale W.', date: 'Mar 28, 2026', rating: 5, vehicle: '2021 Ford F-150', title: 'Fitment exact',
    body: 'Door-frame mount lined up perfectly. Drilling-free is the truth. Shipped in two boxes, no damage.' },
  { name: 'Carlos T.', date: 'Mar 02, 2026', rating: 4, vehicle: '2017 Ford F-150 Crew', title: 'Heavy but solid',
    body: 'Took two of us to lift it up there but once it\'s mounted, this thing is a tank. Slats are thick gauge, no flex. Shaved a star because instructions could be clearer on torque specs.' },
  { name: 'Jess H.',  date: 'Feb 19, 2026', rating: 5, vehicle: '2022 Ford F-150 SuperCrew', title: 'Clean look, no rattles',
    body: 'Was nervous about wind noise — none. Looks factory.' },
];

// Sub-types per category — Tyger-style "buying guide as commerce" landing page
const CATEGORY_SUBTYPES = {
  'roof-racks': {
    headline: 'ROOF RACKS',
    intro: 'Heavy-duty cargo racks engineered for trucks, SUVs, and overland builds. Direct bolt-on for most makes — no drilling.',
    heroImage: 'assets/product-roof-rack.webp',
    subtypes: [
      { code: 'S1', name: 'Crossbar Set', tag: 'Lightweight · Daily', price: 'from $189', summary: 'Aero crossbars for kayaks, bikes, and roof boxes. Bolts to factory side rails or naked roof.', bestFor: 'Daily haulers, weekend trips', image: 'assets/product-roof-rack.webp' },
      { code: 'S2', name: 'Cargo Basket', tag: 'Mid-Duty · Off-road', price: 'from $389', summary: 'Steel mesh basket with raised wind deflector. 350-lb capacity. Bolts directly to crossbars.', bestFor: 'Camping gear, spare tires, fuel cans', image: 'assets/product-roof-rack.webp' },
      { code: 'S3', name: 'Bed Rack', tag: 'Heavy-Duty · Overland', price: 'from $549', summary: 'Pickup bed-mounted modular system. Mount tents, fuel cans, MOLLE panels, awnings.', bestFor: 'Overlanders, RTT users, heavy haul', image: 'assets/product-roof-rack.webp' },
      { code: 'S4', name: 'Low-Profile', tag: 'Stealth · Aerodynamic', price: 'from $329', summary: 'Slim-line aluminum platform that sits 2" above roof. Minimal wind noise.', bestFor: 'Stealth builds, fuel-conscious', image: 'assets/product-roof-rack.webp' },
    ],
    faqs: [
      { q: 'Do I need to drill into my truck?', a: 'No. All Stehlen roof racks bolt directly to factory mounting points or use door-frame clamps. Hardware included.' },
      { q: 'How much weight can it hold?', a: 'Crossbar sets: 165 lbs dynamic / 600 lbs static. Cargo baskets: 350 lbs. Bed racks: 800 lbs static.' },
      { q: 'Will it cause wind noise?', a: 'Aero crossbars and low-profile platforms are designed with wind deflectors. Cargo baskets may produce mild noise above 60mph.' },
      { q: 'Is installation reversible?', a: 'Yes. Bolt-on installation means you can remove the rack and your factory roof is untouched.' },
    ],
  },
  'tonneau-covers': {
    headline: 'TONNEAU COVERS',
    intro: 'Bed covers that protect cargo from weather, theft, and prying eyes. Lock & roll, hidden snap, and flash roll-up styles.',
    heroImage: 'assets/tonneau-flash-roll-up.jpg',
    subtypes: [
      { code: 'T1', name: 'Lock & Roll-Up', tag: 'Secure · Quick Access', price: 'from $239', summary: 'Marine-grade vinyl over aluminum frame with integrated tailgate lock. Roll up to cab in 30 seconds.', bestFor: 'Daily drivers who need anti-theft', image: 'assets/tonneau-lock-roll-up.jpg' },
      { code: 'T2', name: 'Hidden Snap', tag: 'Clean · Low-Profile', price: 'from $189', summary: 'Snap-fastener system tucks under the bed rails for a flush, factory-clean look. No exposed clamps.', bestFor: 'Stealth builds, OEM look', image: 'assets/tonneau-hidden-snap.jpg' },
      { code: 'T3', name: 'Flash Roll-Up w/ Lock', tag: 'Premium · Most Popular', price: 'from $289', summary: 'Quick-release rolling system with integrated locking front rail. Opens to cab in seconds.', bestFor: 'Frequent bed access, mixed cargo', image: 'assets/tonneau-flash-roll-up.jpg' },
    ],
    faqs: [
      { q: 'Will my tonneau cover work with a bed liner?', a: 'Most Stehlen covers fit over under-rail bed liners. Over-rail liners may require trimming.' },
      { q: 'Are these waterproof?', a: 'Water-resistant. Side rails seal with rubber gaskets but heavy downpours may allow minimal seepage at tailgate.' },
      { q: 'Can I run it through a car wash?', a: 'Touchless car washes are safe. Avoid high-pressure brush washes on soft covers.' },
      { q: 'How long does install take?', a: 'Lock & Roll-Up: 15–20 min. Hidden Snap: 25–30 min. Flash Roll-Up: 20–25 min.' },
    ],
  },
  'bumpers': {
    headline: 'STEEL BUMPERS',
    intro: 'Heavy-duty front and rear steel bumpers built for off-road and overland builds. Cold-rolled steel, e-coated and powder-coated.',
    heroImage: 'assets/bumper-modular.jpg',
    subtypes: [
      { code: 'B1', name: 'Modular Style', tag: 'Off-road · LED Ready', price: 'from $789', summary: 'Multi-piece modular bumper with integrated cutouts for fog lights, light bars, and winch mount. Replaceable end caps.', bestFor: 'Trail rigs, customizable builds', image: 'assets/bumper-modular.jpg' },
      { code: 'B2', name: 'Full-Width Steel', tag: 'Heavy-Duty · Recovery', price: 'from $649', summary: 'One-piece full-width front bumper with integrated light bar slot, D-ring mounts, and skid plate. 11-gauge steel.', bestFor: 'Overland, heavy recovery', image: 'assets/bumper-steel.jpg' },
    ],
    faqs: [
      { q: 'Do I need to drill?', a: 'No. All Stehlen bumpers bolt to factory frame mounts. Hardware and instructions included.' },
      { q: 'Will it work with parking sensors?', a: 'Yes — sensor cutouts are pre-drilled on applicable applications. Specify trim during checkout.' },
      { q: 'What about my factory tow hitch?', a: 'All bumpers retain factory hitch use and clearance. D-ring shackle mounts are additional.' },
    ],
  },
  'grilles': {
    headline: 'GRILLES',
    intro: 'Replacement and upgrade grilles. Direct OEM replacement or aggressive aftermarket designs.',
    heroImage: 'assets/product-grille.webp',
    subtypes: [
      { code: 'G1', name: 'Mesh Insert', tag: 'Stealth · Easy Install', price: 'from $129', summary: 'Snap-in or zip-tie behind factory grille. Black powder coat finish.', bestFor: 'Subtle upgrade, no removal', image: 'assets/product-grille.webp' },
      { code: 'G2', name: 'Replacement Shell', tag: 'Aggressive · Full Swap', price: 'from $289', summary: 'Replaces entire grille assembly. Matches factory mounting points.', bestFor: 'Full restyling builds', image: 'assets/product-grille.webp' },
      { code: 'G3', name: 'Light Bar Ready', tag: 'Off-road · LED Compatible', price: 'from $349', summary: 'Integrated cutouts for 30" or 40" LED light bars. Wiring included.', bestFor: 'Trail rigs, off-road builds', image: 'assets/product-grille.webp' },
    ],
    faqs: [
      { q: 'Do I need to drill?', a: 'Mesh inserts: no. Replacement shells: bolt-on, no drilling. Light-bar ready: optional drilling for wiring routing.' },
      { q: 'Will it affect my warranty?', a: 'Bolt-on installations are reversible and typically do not void factory warranty.' },
    ],
  },
};

window.STEHLEN_DATA = {
  CATEGORIES, POPULAR_VEHICLES, PRODUCTS, ACTIVE_PRODUCT, RECENTLY_VIEWED, CART_LINES, REVIEWS, CATEGORY_SUBTYPES,
};
