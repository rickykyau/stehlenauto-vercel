# MIKE — Cycle 13 — Mobile Wrangler Bull Guard

## Mission
Browsing tonight, no rush. Looking at a steel bumper / bull guard for my **2014 Jeep Wrangler 4-door** (JK gen). Open to LED-bar version, matte black preferred. Budget: under $300.

## Device + entry point
**iPhone 14 Pro 390×844** · https://stehlenauto-vercel.vercel.app · cold landing on home.

## Walkthrough

- **0:00** — Home loads fast. Garage chip already shows "2018 FORD F-150" from a prior session — good persistence. Hero "BUILT TOUGH. BOLT ON. DRIVE OFF." renders cleanly. No yellow YMM band crammed onto mobile (cycle-12 fix HELD). Chat FAB is at bottom-LEFT (cycle-12 fix HELD). Cart shows 6 items.
- **0:14** — Tap "CHANGE" on the garage chip to switch to my Wrangler. YMM modal opens — but it's NOT full-screen on mobile, it sits in a small box with margins. List of years shows "2027" at top (we're in 2026 — feels weird). Pick 2014.
- **0:30** — Make list. Notice JEEP is in the list. Pick Jeep.
- **0:36** — Model list shows: Cherokee, Compass, **Durango**, Grand Cherokee, Patriot, Wrangler. **Durango isn't a Jeep, it's a Dodge** — minor data bug but a Jeep guy will spot it. Pick Wrangler.
- **0:42** — Garage chip now reads "2014 JEEP WRANGLER". Good.
- **0:55** — Bottom-tap the burger menu — wait, the menu icon is TINY (~22px). Not gonna mess with it. I know what I want; jump straight to /collections/bull-guards-grille-guards via the categories tile lower on home.
- **1:20** — Bull Guards collection loads. Sticky garage chip says "FITS 2014 JEEP WRANGLER". Banner says "**24 exact fits for your 2014 Jeep Wrangler shown first.**" Great.
- **1:25** — But the FIRST 4 cards are all "✗ DOES NOT FIT" (Dodge Ram, Tesla Model Y, Tesla Model Y, Tesla Model Y). The "exact fits shown first" promise is broken — I'm scrolling past 4 dud products to find a Wrangler one. **MAJOR friction.** RealTruck never shows me Tesla parts when I tell them I drive a Jeep.
- **1:50** — Card #5 finally: green "✓ FITS YOUR 2014 JEEP WRANGLER" — 2010-2018 Jeep Wrangler Advanced Series Bull Guard, $196. Tap it.
- **2:00** — PDP loads. Hero image looks like a Ford F-150 (orange paint, F-150 grille shape) with a bull guard on it — but this is supposed to be a Wrangler product. Misleading photography. Image is clear, swipe arrows visible "1/7". I scroll the gallery — works but the thumbnails aren't tappable below the main image; I can only use the prev/next arrows. RealTruck and Amazon show clickable thumbnails right below.
- **2:30** — Title, 4.7 stars (0 reviews) — wait, "(0 reviews)" with 4.7 stars? That's lying. Either remove the stars or stop saying "0 reviews". Mike: "What is this 4.7 based on if no one's reviewed it?" **MINOR but trust-eroding.**
- **2:45** — Big green CONFIRMED FITMENT ribbon "Fits your 2014 Jeep Wrangler · Engineered for direct bolt-on installation · Change vehicle". This is excellent. **HELD.**
- **2:55** — $196.00, "or 4 interest-free payments of $49.00 with Affirm". Universal Fit · No sub-model config (correct — Wrangler doesn't need bed length). Qty stepper, ADD TO CART · $196.00 (chunky orange bar, easy to tap). Buy Now with Affirm.
- **3:30** — Scroll down. Tab strip: FITMENT, FEATURES, SPECS, INSTALLATION. Tap FEATURES.
- **3:35** — **BLOCKER**: FEATURES tab says "DOOR-FRAME MOUNT — Engineered to clamp to factory door frames, no drilling, reversible with no trace" and "SLOTTED CROSSBARS — accessory clamps in every crossbar". **This is roof rack copy on a bull guard product.** A bull guard bolts to the front bumper. It doesn't have crossbars. It doesn't mount to door frames. This is the same template-mismatch class of bug cycle 12 was supposed to kill — they just moved it from SPECS to FEATURES.
- **4:00** — Tap SPECS. Now generic ("Detailed specs are listed in the product description above"). No actual spec table. So the SPECS tab is functionally empty. Fix made it not-wrong but also not-useful.
- **4:15** — Tap INSTALLATION. "Mount door-frame brackets at marked positions; hand-tighten only. Lift assembled rack onto truck (2 people) and seat onto brackets." **Roof rack install steps on a bull guard PDP again.** Same template bug. Also the "Installation Guide (PDF)" link 404s in the console.
- **5:00** — Tap chat FAB (bottom-left, 48px, fine). RIG opens.
- **5:05** — Chat panel is NOT full-screen on mobile — leaves a sliver of page on the right. Looks half-baked. Quick prompts: "Will this fit my truck?" / "Track an order" / "Install help" / "Talk to a human". Tap "Will this fit my truck?".
- **5:20** — Reply: "good question, but i need a bit more info. you've got a **2014 Jeep Wrangler** saved to your account — so that part's covered. what i'm missing: - **which product** are you asking about? - **which trim/body style?**" — **(1)** the markdown asterisks render as raw `**text**` not bold. **(2)** I'm literally on the product page. The chat doesn't know what page I'm on. RealTruck/Amazon chat: when I'm on a PDP and I ask "does this fit", they read the URL.
- **6:30** — Close chat. Tap ADD TO CART. Cart drawer slides in.
- **6:35** — Cart drawer is NOT full-screen — leaves ~10% of page on the left. Still readable. Red banner "MIXED FITMENT — SOME ITEMS DO NOT FIT YOUR 2014 JEEP WRANGLER" — fair warning since I have F-150 tonneau and Mazda hitch left over from prior session. Line items show image + title + qty + price, prices NOT clipped. **Cycle-12 cart price clipping fix HELD.**
- **7:00** — Navigate to /cart for the full page. Hero "REVIEW YOUR ORDER." renders cleanly on 2 lines (cycle-12 fluid font fix HELD — no more 3-line giant). Mixed fitment banner. Free shipping unlocked bar.
- **7:30** — Cart line items have a **layout bug** — the product image is 96px wide but the grid column is only 80px, so the image overflows its column. Then the qty stepper + price stack BELOW the image (in the narrow column) instead of below the title (wider column). It works but looks rushed.
- **8:00** — Subtotal $1115.00, tax $97.56, TOTAL $1212.56. Affirm 4× $303.14. CHECKOUT button.
- **8:15** — Tap CHECKOUT — handoff to `stehlenauto.myshopify.com/cart/c/...` (Shopify hosted). Good — that's the right pattern. Don't make me fill another form just to fill it again on Shopify.
- **8:30** — I navigate to /checkout to inspect the in-app review-and-pay page. "REVIEW & PAY" hero clean. Item list renders FAR cleaner here than on /cart — image, title, qty, price all align in a tidy row. Why isn't /cart using this layout?
- **9:00** — Side trip: revisit the F-150 tonneau PDP to verify the cycle-12 SPECS fix on a tonneau cover. **Same bug**: FEATURES tab on a soft vinyl roll-up tonneau still says "HEAVY-DUTY STEEL — 11-gauge cold-rolled steel construction · 600-lb static load rating · 250-lb dynamic capacity at highway speeds" and "TEXTURED POWDER COAT". It's a vinyl tonneau. There's no steel, no powder coat. Cycle-12 only emptied SPECS — FEATURES still has the wrong universal template.
- **9:30** — Also notice on this F-150 PDP (Wrangler garage active): the disabled "DOES NOT FIT YOUR VEHICLE" CTA renders as a hairline (~22px tall) instead of a chunky button. Looks like a label, not a control. Easy to overlook.
- **10:00** — Done. Stopwatch stop.

## Friction log

- **F-1 [BLOCKER]** PDP FEATURES + INSTALLATION tabs serve identical universal text ("door-frame mount", "11-gauge cold-rolled steel", "slotted crossbars", "lift assembled rack") on **every** product type, including bull guards and soft vinyl tonneau covers. Cycle 12 only neutralized SPECS — FEATURES and INSTALLATION still have wrong template content. Verified on 2 product types (bull guard, tonneau).
- **F-2 [BLOCKER]** "Installation Guide (PDF)" link returns 404 (`/help/install/<product-slug>` route doesn't exist).
- **F-3 [MAJOR]** Bull Guards collection: banner promises "24 exact fits shown first" but the first 4 cards are all `DOES NOT FIT` (Tesla Model Y, Dodge Ram). Sort is broken or not running. Customer thinks "site doesn't actually know my truck."
- **F-4 [MAJOR]** Header icon buttons (cart, menu, search) measure 20-22px wide/tall — well below Apple's 44×44 minimum. Constantly mis-tap. The cart icon especially needs more padding around it.
- **F-5 [MAJOR]** `btn-lg` has no `min-height` — when disabled (e.g. "DOES NOT FIT YOUR VEHICLE"), the button collapses to ~22px. Looks like a spec line, not a CTA.
- **F-6 [MAJOR]** Cart line item layout: 96px-wide product image overflows its 80px grid column; qty/price stack under the image (narrow column) instead of under the title (wider column). The /checkout page renders the same line-items correctly — just port that layout to /cart.
- **F-7 [MAJOR]** Chat panel and cart drawer are NOT full-screen on mobile — both leave a sliver of the page visible on one side. Looks half-built.
- **F-8 [MAJOR]** Chat doesn't know which product page I'm on. Asks "which product are you asking about?" while I'm staring at the PDP. Should auto-inject current SKU/title.
- **F-9 [MINOR]** Chat replies render markdown asterisks as raw `**text**` instead of bold.
- **F-10 [MINOR]** Hero image on the Wrangler bull guard PDP shows what looks like a Ford F-150 with a bull guard. Wrong photo for the product OR misleading.
- **F-11 [MINOR]** "4.7 stars · (0 reviews)" — if no one's reviewed it, don't show stars. It's a credibility hit. Either show stars when reviews exist or remove the rating row.
- **F-12 [MINOR]** YMM modal: 2014 Jeep model list includes "Durango" — Durango is a Dodge, not a Jeep.
- **F-13 [MINOR]** YMM modal Year list starts with 2027 (we're in 2026). Looks like the year tree includes a future year.
- **F-14 [MINOR]** YMM modal is NOT full-screen on mobile (small bordered box). On a 390px phone, full-screen is the right call.
- **F-15 [MINOR]** PDP image gallery has prev/next arrows but no tappable thumbnail strip below the hero image. Have to tap arrows 6 times to see image 7. RealTruck shows a horizontal swipeable thumb strip.
- **F-16 [MINOR]** Two stacked sticky bars at the top of every page (announcement strip + header w/ garage chip) eat 140px on a 844-tall screen — ~17% of screen lost to chrome before content.
- **F-17 [MINOR]** "YOUR CART · 7 ITEMS" but only 4 line items visible. 7 = total qty across lines. Confusing labeling — should say "7 ITEMS · 4 PRODUCTS" or just "4 PRODUCTS".

## What worked

- Garage chip persists across the session and shows on every page — never lost track of which truck I'm shopping for.
- Green "CONFIRMED FITMENT · Fits your 2014 Jeep Wrangler · Engineered for direct bolt-on" ribbon on PDP is gold-standard. Big, green, immediate.
- Red "DOES NOT FIT" badges on collection cards work as advertised — even if the sort doesn't put fits first.
- Cart prices don't clip on mobile (cycle-12 fix held).
- Cart hero "REVIEW YOUR ORDER." renders on 2 clean lines (cycle-12 fluid font fix held).
- Chat FAB is at bottom-left (cycle-12 fix held).
- No yellow YMM band on mobile (cycle-12 fix held).
- No horizontal page scroll anywhere — viewport math is clean.
- Checkout page (`/checkout`) renders line items beautifully — better than `/cart` does.
- "DOES NOT FIT YOUR VEHICLE" disabled state correctly gates ATC on F-150 tonneau when garage is Wrangler. Logic right; styling wrong.

## What competitors do better

- **RealTruck**: when I set my truck, the collection actually filters out everything that doesn't fit by default — I have to opt into seeing other-truck products. They don't show me Tesla parts when I tell them I drive a Jeep.
- **Amazon**: chat assistants on a product page know what product I'm looking at. They auto-prefix the conversation with the ASIN/title.
- **AutoZone**: PDP has a real spec table — gauge, weight, dimensions, MPN, included hardware. I can scan and compare in 5 seconds.
- **RealTruck**: image gallery has a clickable thumb strip below the hero so I don't have to tap arrows 6 times.

## Buy decision

- **Would I check out today? MAYBE — leaning NO.**
- **Why:** The Wrangler bull guard at $196 is a fair price and the green CONFIRMED FITMENT removes the doubt about whether it'll actually bolt to my JK. But the moment I tap into FEATURES and read "door-frame mount, slotted crossbars", I think this site sent me the wrong product page or the listing was copy-pasted from a roof rack. That kills my trust. The 0-review-but-4.7-stars thing piles on. Then the Installation Guide PDF 404s — am I going to be stuck with a steel bumper and no instructions? I'd open RealTruck in another tab and check there before pulling the trigger.
- **"Would I buy" rating: 5/10** — design and fitment story are strong, but product copy contradicts the product type and that's a deal-breaker for a $200 part.
- **"Would I come back" rating: 6/10** — the garage saving + fitment ribbon are good enough to bring me back if cycle 14 nukes the wrong-template-content bug.

Mike's verdict: Site looks slick on my iPhone and the green "fits your truck" ribbon is the best in the business — but every product PDP reads like it was copy-pasted from a roof rack listing, so I'd back out and check RealTruck before paying.
