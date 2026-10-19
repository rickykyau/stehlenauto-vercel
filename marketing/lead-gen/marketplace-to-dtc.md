# Marketplace-to-DTC Migration
## Converting eBay and Amazon Buyers into stehlenauto.com Customers

**Priority rank:** 7 of 9
**Owner:** Marketing (insert card program) + Operations (packing/shipping workflow)
**Budget range:** $800-$1,200/mo (insert card printing + design)
**Expected CAC:** $12-$30 (lowest CAC in the entire acquisition mix)
**Time to first attribution:** 7-14 days after inserts ship with orders

---

## The Play

Stehlen currently ships $8-10M/year through eBay and Amazon. Every single
shipment reaches a truck owner who just proved they buy truck accessories from
Stehlen. That is a qualified buyer, in hand, cost-already-paid, opening a
package from us.

A physical insert card in that package is the cheapest possible acquisition
channel: $0.08 per card at 10,000 volume + design cost = approximately
$0.10-$0.15 per impression on a verified buyer. At 2-4% conversion to DTC,
that is a $3.75-$7.50 CAC before any overhead — far below the paid CAC
of $55-$110.

The insert program is not "marketing" in the traditional sense. It is
conversion of an existing touchpoint that Stehlen already owns. The only
new cost is the card.

### Why this is acquisition, not reactivation

The Champions list reactivation program (Brevo) targets buyers who gave us
an email address and can be contacted directly. The insert card program targets
a different segment: the 543,806 marketplace buyers with masked email addresses
(Amazon buyer-protection email or eBay buyer-protection email) who cannot be
emailed but are receiving physical packages.

These buyers have never visited stehlenauto.com. Converting them to a direct
site visit and purchase is net-new DTC customer acquisition.

---

## Concrete Setup Steps

### Step 1: Insert Card Design

**Size:** 4x6 inches (postcard format — fits in any product box, feels premium
vs. a folded flyer, cheaper to print than folded inserts)

**Front copy:**
```
[Stehlen Auto logo]
10% OFF your next order.
stehlenauto.com — use code DIRECT10

Direct from the manufacturer.
No marketplace markup. Ships in 1-3 days.
```

**Back copy:**
```
[QR code linking to stehlenauto.com?utm_source=insert&utm_medium=physical&utm_campaign=marketplace-migration]

"Why order direct?"
- Save on every order vs. marketplace pricing
- Fitment guarantee — we guarantee it fits your vehicle
- Direct CS — call or chat with the team that made it
- Vehicle-specific recommendations when you save your vehicle

Find everything for your [Ford / Chevy / Ram / Toyota / GMC]:
stehlenauto.com/[vehicle-make]
```

**Personalization option (if operationally feasible in month 2+):**
Print separate insert variants per vehicle make — "Everything for your Ford"
with a Ford collection URL. Six variants (Ford, Chevy, Dodge/Ram, Toyota, GMC,
Universal). This requires ChannelAdvisor order data to know which make is on
the order, and packing station software to assign the correct insert. For
month 1, use a universal insert. Add personalization in month 2-3 as operations
workflow supports it.

**Design:** Clean, truck-culture aesthetic. Black or charcoal background. White
text. Product photography (installed on truck). No clipart, no generic stock
images. Use Midjourney or Firefly (in stack) to generate the hero image from
a text prompt of the product installed on the hero vehicle if product photography
is not available yet.

### Step 2: Print Vendor and Cost

**Quantity:** 10,000 cards/month (matches approximate monthly shipment volume)
**Vendor options:** GotPrint, PrintingForLess, or local CA print shop near
the Walnut warehouse. At 10,000 qty, 4x6 postcard, full color, 14pt cardstock:
approximately $80-$120 for the print run + $25 design setup (one-time).

**Total monthly cost:** $80-$120 printing + $0.05-$0.10 per card in labor to
include in packing = ~$900-$1,100/mo at 10,000 shipments

If shipment volume is lower (e.g., 5,000/mo), reduce print quantity to match.
Do not print 6 months of cards at once — the discount code might change,
the URL might change, the design might be updated.

### Step 3: Operations Integration

**Packing station instruction:** Add one insert card to every outbound eBay
and Amazon shipment. Place on top of product or under the packing slip.
This is a 2-second action per shipment — zero workflow disruption.

**Exclusions (if any):** Do NOT include in Amazon FBA shipments that ship
directly from Amazon warehouse (you don't control the packing). Include only
in FBM (Fulfilled by Merchant) shipments where Stehlen controls the pack.

**eBay:** All eBay shipments are FBM by definition (eBay has no warehouse
fulfillment). Every eBay order gets a card.

**Note on eBay policy:** Including a physical card referencing your own
website with a discount code is permitted under eBay policy as of 2026 —
it is considered product information, not solicitation to transact off-eBay.
Do NOT include language that says "don't buy from eBay next time." Just say
"order direct at stehlenauto.com." The card should feel like a brand touch,
not like you're pulling them off the platform.

**Amazon policy clarification:** Amazon's seller policy prohibits directing
customers to external websites via seller communications (messages, emails
through Amazon's system). However, a physical insert card in the product
package is permitted as long as it does not reference the Amazon order,
does not offer an Amazon review in exchange for a discount, and does not
solicit the customer to leave Amazon's platform. Reference only your website.
Do not say "Instead of buying on Amazon, buy from us." Say "Find all our
accessories at stehlenauto.com." This distinction is important — Amazon
has suspended sellers for insert card violations when the cards were too
explicitly anti-Amazon.

### Step 4: UTM Attribution

Every insert card QR code links to:
`stehlenauto.com?utm_source=insert&utm_medium=physical&utm_campaign=marketplace-migration`

GA4 will track sessions and conversions from this source. At end of month 1,
pull GA4 report: Sessions from utm_source=insert → Conversion rate → Revenue.
This gives exact CAC for the insert program.

If the QR code scan rate is low (not all buyers scan QR codes), also track
the discount code `DIRECT10` usage in Shopify — any order using that code
is attributable to the insert program even without a QR scan.

### Step 5: eBay Seller Messaging (Supplement — Not Main Channel)

eBay allows sellers to message buyers within the platform for order-related
communication. This is a secondary touchpoint, not the primary one.

**Permitted eBay message content (post-purchase, once):**
"Thank you for your Stehlen order. If you have any questions about the
product or installation, visit stehlenauto.com for our install guides and
fitment resources. [Your CS contact info]"

**What is NOT permitted:** Offering a discount to buy again off-eBay, telling
them to leave eBay feedback in exchange for a benefit, or spamming them with
marketing messages. Stick to service-oriented communication.

---

## Conversion Rate Benchmarks

Insert-in-box conversion benchmarks from DTC brands in adjacent verticals
(directional, not Stehlen-specific benchmarks):
- E-commerce average: 1-3% of insert recipients visit the URL
- Brands with a compelling offer (10%+ discount): 2-5%
- At 10,000 inserts/mo and 3% conversion: 300 site visits/mo from inserts
- At 2% purchase CVR on those visits: 6 orders/mo
- At $214 AOV: $1,284/mo
- At insert cost $1,000/mo: 1.3x ROAS from inserts alone

This math looks thin in isolation. But it is compounding:
- 300 site visits/mo → 300 potential email captures (at 5% popup rate = 15 new
  leads who enter the Welcome Series)
- 15 Welcome Series leads → 8-12% conversion = 1-2 additional orders/mo at
  near-zero marginal cost
- LTV compounds: a buyer who converts from insert and becomes a repeat buyer
  has $300+ LTV from a $0.12 acquisition investment

The insert program's real ROI is not the first-order ROAS. It is the first-order
plus the LTV of the DTC repeat buyer who was previously locked in the marketplace.

---

## Vehicle-Specific Variant (Month 2+)

Once the packing workflow is established, add vehicle-make personalization:

**How it works:**
1. ChannelAdvisor order data includes the vehicle tags on the product ordered
2. The packing station software (or manual lookup) determines which make
   is on the order
3. Insert is selected from the make-specific box (F, S, R, T, G, U)

**Make-specific insert copy example (Ford variant):**
Front: "10% off your next order. stehlenauto.com — code DIRECT10"
Back: "Everything for your Ford — F-150, F-250, F-350, Ranger.
  400+ accessories, direct from the manufacturer.
  stehlenauto.com/ford"

**QR code URL for Ford variant:**
`stehlenauto.com/collections/ford?utm_source=insert&utm_medium=physical&utm_campaign=ford-migration`

This enables segmented attribution: how does the Ford insert convert vs.
the Chevy insert vs. the Ram insert? By month 3, this data informs which
vehicle makes to prioritize in paid acquisition.

---

## Budget and Expected Output

**Month 1 (10,000 inserts — $900/mo):**
- Print: $100
- Design (one-time): $100
- Packing labor: $700
- Expected site visits from inserts: 200-400
- Expected first orders: 4-12
- Expected DTC email captures: 10-20
- Expected CAC: $75-$225 (first order only; drops significantly with repeat purchase)

**Month 3+ (10,000/mo with make-specific variants — $1,100/mo):**
- Print 6 variants: $120
- Packing labor (slightly higher for variant sorting): $780
- Expected first orders: 8-20/mo as brand awareness builds
- Expected CAC (blended with LTV): $15-$30 by month 6 as repeat purchases
  from insert-converted customers compound

---

## KPIs

- Primary: utm_source=insert sessions in GA4 (target 200-400/mo)
- Primary: DIRECT10 coupon code redemptions in Shopify per month
- Primary: Insert-attributed first-order revenue and CAC
- Secondary: Email capture rate from insert-sourced sessions (target 5-8%)
- Guardrail: Amazon seller account policy compliance — zero platform
  violations from insert card language (review monthly)
- Guardrail: Card quality — check that QR code scans correctly on every
  new print batch before distributing to packing stations

---

## Implementation Handoff

Operations:
- Print order placed with vendor (lead time: 5-7 business days)
- Packing station briefing: one insert per outbound FBM shipment
- Storage: keep inserts at packing station in labeled box

Engineering needs:
- UTM link verified in GA4: sessions from utm_source=insert tracked correctly
- DIRECT10 discount code created in Shopify (10% off first order, new customer
  only, one-time use per email)
- Confirm the Shopify discount code cannot be stacked with other discounts

Marketing-only:
- Insert card design (Midjourney for product imagery + Canva for layout)
- Print vendor order
- Monthly attribution pull from GA4 + Shopify

---

## NEXT ACTION (This Week)

Design the insert card today using the copy template above. Place the print
order tomorrow ($100 for 1,000 cards as a test batch — run a 1,000-card pilot
before committing to 10,000/mo). Verify packing staff has clear instruction to
include one card per shipment. The entire setup is less than 4 hours of work.
The CAC on this channel is the lowest in the mix — every week without inserts
in the box is $1,200-$7,500 in missed revenue opportunity.

CTR + open-rate KPI risk: low (physical, no CTR dependency). Conversion
co-ownership: medium (depends on site landing experience after QR scan).
Revenue confidence: high for the first-order mechanism; medium for LTV
compounding (depends on repeat purchase rate which is site-experience-driven).
