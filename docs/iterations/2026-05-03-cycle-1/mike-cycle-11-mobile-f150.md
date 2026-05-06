# Mike Rodriguez — Cycle 11 Mobile Buy Mission (iPhone SE 375x667)

## Mission
Soft tonneau cover for my **2018 Ford F-150 SuperCrew, 5.5' bed**. Need it by Friday. Budget under $400. Shopping on my phone in the truck at the job site.

## Device + entry point
- iPhone SE size: 375 x 667 (Playwright)
- Entry: https://stehlenauto-vercel.vercel.app (cold land on home)
- Garage state: empty

## Walkthrough

- **0:00** — Land on home. Black, yellow accents, tells me it's a heavy-duty truck shop in 2 seconds. "SELECT YOUR VEHICLE" button is right under the header — I know what to do.
- **0:08** — Tap the YEAR dropdown in the hero band. Modal opens full-screen-ish, year list scrolls. Tap targets feel ~46px each.
- **0:18** — Pick 2018. Step 2 of 3 = Make. "2018" pill stays at the top so I know where I am. Pick Ford. Step 3 of 3 = Model. Pick F-150.
- **0:48** — Garage banner now shows "● 2018 FORD F-150 / CHANGE" in the header on every page. Reassuring. **BUT — the hero on the home page still shows the empty SHOP BY VEHICLE / YEAR / MAKE / MODEL band underneath, like I never picked anything.** Doesn't trust the garage I just set.
- **1:20** — Tap "Tonneau Covers" tile. Land on /collections/tonneau-covers. SSR — no spinner. Page knows "FITS 2018 FORD F-150" (green chip). "24 exact fits for your 2018 Ford F-150 shown first." This is the strongest signal on the whole site.
- **1:38** — Scroll the grid. 2-col card layout, fitment chip on every card (green ✓ FITS, gray CHECK FITMENT, red ✗ DOES NOT FIT). The first 2 fit, then I'm flooded with 9 red Toyota Tundra cards in a row. Why is the site showing me 286 products when 24 fit my truck? No way to filter to just my trucks.
- **2:30** — Tap FILTERS. Drawer slides up, full-screen overlay with sticky yellow "SHOW 286 PRODUCTS" CTA at bottom. Filter list: Fitment, Category, Vehicle Type, Make, Model, Year. **NO Material filter. NO Bed Length filter. NO Style filter (soft / hard / tri-fold / roll-up).** I can't refine within the category.
- **3:20** — Close drawer. Tap the F-150 6.5ft Soft Roll-Up at $181 (closest to a soft I can find — but it's the wrong bed length, 6.5ft not 5.5ft).
- **3:30** — PDP loads. Big hero, image gallery, sticky garage banner, CONFIRMED FITMENT green card: "Fits your 2018 Ford F-150 / Engineered for direct bolt-on installation". $181, Affirm $45.25 x4. **WAIT — the site is telling me a 6.5ft tonneau fits my SuperCrew with a 5.5ft bed. That's flat wrong.** Heavy-duty branding says "Fitment guaranteed or your money back." If I trust the green badge and order, I get a $181 mistake delivered to Phoenix.
- **5:00** — Sticky bottom buy bar shows "$181 / ADD TO CART" — nice. ADD TO CART button is stacked vertically with the heart and Buy Now with Affirm — clean. Tap ADD TO CART.
- **5:30** — Cart drawer slides in from right. Top banner: "MIXED FITMENT — SOME ITEMS DO NOT FIT YOUR 2018 FORD F-150" in red (catches the leftover test items). Subtotal partially obscured by chat FAB. CHECKOUT yellow CTA full-width.
- **6:00** — Open /cart full page. "REVIEW YOUR ORDER." headline takes 3 lines of huge desktop type, eats half the viewport. Line items break: title column squeezed to ~90px, breaks 1-2 words per line for 9 lines, and the **price column is clipped on the right edge ($18... / $13... / $16...)**.
- **6:20** — Scroll past line items. Promo code field, totals. CHECKOUT $851.51 yellow CTA works. Tap it — Shopify hosted checkout opens at stehlenauto.myshopify.com/checkouts/cn/...  Hand-off works.
- **6:30** — Back to PDP. Open chat assistant FAB bottom-right. Panel slides up to ~70% viewport (not full-screen). Quick-reply chips: WILL THIS FIT MY TRUCK? / TRACK AN ORDER / INSTALL HELP / TALK TO A HUMAN.
- **6:40** — Tap "Will this fit my truck?". RIG replies: **"need a product name or SKU to check fitment. what are you looking at?"** I'm standing on the PDP. The chat doesn't know what page I'm on.
- **7:10** — Type "ITEM-022132 — will it fit my 2018 F-150 5.5 bed?". Wait 15 sec. RIG: "i don't have that SKU in my system right now, so i can't confirm fitment. call 1-888-378-4536, the team can pull up ITEM-022132 and confirm against your exact bed length." Honest fallback, but it doesn't know my garage either, and the site clearly does.
- **9:00** — Scroll PDP to FITMENT/SPECS tabs. FITMENT tab says "Per-year compatibility detail is in the product title above (e.g. years and bed length / cab type)." So the site is telling me to read the title and figure it out myself. SPECS tab says "MATERIAL: 11-gauge cold-rolled steel / FINISH: Triple-stage powder coat matte black" — for a SOFT FABRIC TONNEAU. Wrong placeholder data leaked into the spec table.
- **11:00** — Check vehicle hub /vehicle/ford-f-150. "FORD F-150" headline fluid-fits cleanly on 2 lines — that hero fix worked here. PICK YOUR YEAR yellow grid is great. But scroll down: "KNOW YOUR F-150" heading wraps "F" / "150" with the chat FAB blocking the F. Same fluid-font miss as cart.
- **13:00** — Verify popular vehicle counts removed on home — yes ✓, brand/model/year only, no parts counts. Trust row 2-col on mobile — yes ✓. ADD TO CART vertical stack on PDP — yes ✓. Vehicle hub headline fluid-size — yes ✓ (but only on that one page).
- **14:30** — Category tiles at bottom of home: titles truncated mid-word ("ROOF RACKS &" / "CHASE RACKS" / "MOLLE" / "UNDER SEAT") losing the second word.
- **15:00** — Done.

## Friction log

- **F-1 [MAJOR] — Hero YMM band still rendered on mobile after garage is set.** I set 2018 Ford F-150 in the modal, the header confirms it, but the hero below still shouts "SHOP BY VEHICLE / YEAR / MAKE / MODEL" with empty pickers. Either kill the band on mobile when garage is set, or convert it to "Browsing as 2018 Ford F-150." Right now it's a sloppy double-prompt that contradicts the brief saying this band was hidden on mobile. Computed style on the labels confirms `display: flex / block` — the hide rule didn't ship for this mobile width.

- **F-2 [MAJOR] — No filter for "fits my truck only."** Collection page shows 286 products, ranks the 24 that fit at top, then floods me with red ✗ DOES NOT FIT cards. I should be able to toggle "hide non-fitting" or have a section break ("PRODUCTS THAT DON'T FIT YOUR TRUCK — collapse"). Currently if I scroll past row 12 I'm just looking at Tundras.

- **F-3 [MAJOR] — Chat FAB obscures sticky CTAs across the entire site on a 375px viewport.** Filter drawer's "SHOW 286 PRODUCTS" yellow CTA — overlapped. Cart drawer subtotal — clipped ("$7..."). Cart page Tax (est.) line — clipped ("$68..."). PDP trust row "30-day hassle-free returns" — overlapped. Footer SUBSCRIBE — clipped. Vehicle hub "KNOW YOUR F-150" headline — F is hidden behind the FAB. The FAB needs to either auto-hide when a sticky bottom bar is showing, scoot up above bottom bars, or live in a smaller corner badge on mobile.

- **F-4 [MAJOR] — No faceted filters that matter inside a category.** Tonneau Covers offers Fitment / Category / Vehicle Type / Make / Model / Year only. Missing: Material/Style (Soft, Hard, Tri-fold, Roll-up, Retractable), Bed Length (5.5 / 6.5 / 8 ft), Brand, Price. RealTruck and AAG put these at the top of every category. Without them I can't find "soft 5.5 ft under $400" without scrolling 24 cards by hand.

- **F-5 [BLOCKER] — Fitment confirmation on PDP is wrong; brand-promise risk.** I selected 2018 F-150 (SuperCrew, 5.5' bed implied). PDP for a "2015-2024 Ford F-150 6.5 ft Bed Soft Roll-Up Tonneau Cover" shows GREEN "Fits your 2018 Ford F-150" with no sub-model gate, no bed-length question, label "UNIVERSAL FIT · NO SUB-MODEL CONFIG." A 6.5ft tonneau will not fit a 5.5ft bed. This is the exact failure mode the sub-model strip was built to prevent (per CLAUDE.md). If a customer believes the badge and orders, that's a wrong-fit return + trust loss. The "Fitment Guaranteed or your money back" promise gets exercised.

- **F-6 [MAJOR] — Fluid font-size fix didn't propagate to all heroes.** Vehicle hub headline ("FORD F-150") wraps cleanly — fixed. But cart page "REVIEW YOUR ORDER." takes 3 huge lines, vehicle hub second-section "KNOW YOUR F-150" wraps the model number. Footer "BUILD YOUR RIG WITH US." wraps to 5 lines of 4 chars. The fix needs to apply to all display-style headings, not just one route.

- **F-7 [BLOCKER] — Cart page line items break catastrophically at 375px.** Three-column layout (image | title | qty+price) when there's no room. Title squeezes to ~90px and wraps "2015- / 2024 / Ford F- / 150 6.5 / ft Bed / Soft / Roll-Up / Tonneau / Cover" across 9 lines. **Price column is clipped at the right edge** — I see "$18..." with the rest hidden. Customers can't see what they're paying for. Stack vertically below the small viewport: image + title on row 1, qty + price + remove on row 2.

- **F-8 [MAJOR] — Chat assistant has zero context.** I open chat from a PDP. I tap "Will this fit my truck?" The chat asks me which product. The whole point of the FAB on a PDP is the agent already knows which product I'm looking at AND what's in my garage. Both context strings missing.

- **F-9 [MAJOR] — PDP SPECS table contains template/placeholder text inconsistent with the product.** A SOFT vinyl roll-up tonneau cover should not list MATERIAL "11-gauge cold-rolled steel" and FINISH "Triple-stage powder coat matte black." Looks like default category specs leaking onto unrelated products. Mike notices this stuff — kills credibility instantly.

- **F-10 [MINOR] — Category tile titles truncated mid-word.** "ROOF RACKS &" / "CHASE RACKS" / "MOLLE" / "UNDER SEAT" — the second word gets cut. Either wrap to 2 lines or use shorter labels.

- **F-11 [MINOR] — Mobile menu top-level rows show > arrows but don't expand; they navigate to /collections.** Misleading affordance. Either remove the arrow or make them expand into sub-categories on tap.

- **F-12 [MINOR] — "CHECK FITMENT" wishy-washy chip wording.** When I have a 2018 F-150 set and the product is for the 2022+ Ford F-150 Lightning (a different platform), the chip says "CHECK FITMENT FOR YOUR FORD F-150." The system clearly knows it doesn't fit (Lightning ≠ ICE F-150). Either say DOES NOT FIT or be specific: "Different platform — Lightning EV only."

## What worked

- **Garage banner persistence** — once set, the "● 2018 FORD F-150 / CHANGE" header rides on every page. Cookie/auth persistence is solid.
- **YMM modal flow** — 3 clear steps, big tap targets, selected pills retained between steps, easy to back out.
- **Collection fitment chips on cards** — green / gray / red is unambiguous at a glance.
- **"24 exact fits for your 2018 Ford F-150 shown first"** plain-language ranking line.
- **Cart drawer mixed-fitment red banner** ("MIXED FITMENT — SOME ITEMS DO NOT FIT YOUR 2018 FORD F-150") catches the right thing.
- **PDP buy-box stack on mobile** (yellow ADD TO CART → wishlist → Buy Now with Affirm) is clean and tap-friendly.
- **Sticky bottom buy bar on PDP** keeps price + ADD TO CART in thumb reach.
- **Cart-to-Shopify-checkout handoff works** — clean URL, branded.
- **Trust row 2-col on mobile** ✓.
- **Popular vehicle cards no longer show parts counts** ✓.
- **Vehicle hub headline fluid-fit** ✓ (where it was applied).
- **Page transitions are SSR/fast** — no spinner blanks, nothing felt janky except the line-item layout.
- **Chat is honest when uncertain** — "i don't have that SKU... call us" beats hallucinating a yes.

## What competitors do better

- **RealTruck**: Material / Style / Bed Length / Brand / Price filters at the top of every category, and a "Show only items that fit my truck" toggle. Solves F-2 + F-4.
- **AAG (Auto Accessories Garage)**: PDPs gate Add-to-Cart behind a bed-length / cab-type chip when the product spans multiple sub-models. Solves F-5.
- **AutoZone mobile cart**: stacks line items vertically on small screens — image+title row, qty+price+remove row. Never clips price. Solves F-7.
- **Most Shopify Dawn-themed shops**: hide the chat bubble when a sticky CTA bar is visible. Solves F-3 cheaply.

## Buy decision

- **Would I check out today? NO.**
- **Why:** I tried to confirm fitment three ways. The PDP green badge said it fits — but I know my truck has a 5.5 bed and the cover is 6.5. The chat couldn't help. The FITMENT tab told me to read the title myself. I'm not betting $181 + shipping each way on a guess. The prices are right, the brand looks legit, the trust signals are all there — but the one thing that has to be airtight (does this part fit my truck) is exactly what the site can't answer correctly. Until F-5 is fixed I bounce to RealTruck.
- **"Would I buy" rating: 4 / 10** (would have been 7 without the bed-length false positive)
- **"Would I come back" rating: 6 / 10** (the brand and the YMM modal are good enough that I'd give it another shot in 2 weeks)

Mike's verdict: solid bones and the right brand voice, but the site told me a 6.5-foot cover fits my 5.5-foot bed — I'm not paying $181 to find out it lied.
