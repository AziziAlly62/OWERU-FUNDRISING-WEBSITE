# OWERU Foundation — Phase One Platform
## Improved Concept & Product Plan (v2.0) · "We buy. We deliver. We publish."

| Field | Value |
|---|---|
| Document | Phase One Platform — Improved Concept & Product Plan |
| Client | OWERU Foundation |
| Prepared by | Azizi Ally (Development Lead) |
| Version | 2.0 – Concept Improvement & Build Plan |
| Date | 04 September 2026 |
| Status | For client review & sign-off |
| Source baselines | `docs/SRS-OWERU-Phase-One.md` (v1 SRS) · Laravel prototype (`backend/`) · React prototype (`frontend/`) |

---

## 0. Read This First — the improved idea in 10 bullets

1. **The client truth never changes:** OWERU buys things and gives them. It never gives money. Every control in the system flows from that one sentence.
2. **Donors are guests by default.** No account, no email, no password. A donor gives with **just a phone number** — they already know how to use M-Pesa, Tigo Pesa or Airtel Money.
3. **Pay by STK push, exactly like buying airtime or paying LUKU.** The donor taps "Donate", enters an amount, confirms the PIN request that pops up on their own phone. That is the whole checkout. (~77% of all Tanzanian mobile-money transactions already happen over USSD on basic phones — we meet users where they are.)
4. **The item is the unit of giving, not the campaign.** Each request becomes a catalogue of specific items ("Portable PA system 500W — TZS 2,600,000"). Donors pick one item, see a photo, see the progress bar, and fund it. Money from one item is never mixed with another.
5. **Small is welcome.** Every item is broken into **shares** (e.g. TZS 2,000 per share = one microphone cable). A market woman's TZS 5,000 is as valuable as a diaspora donor's $100. "Sponsor one item" framing (like "$25 = one study Bible") is proven in faith giving.
6. **The money can never reach the applicant.** Confirmed funds move: donor → payment provider → **OWERU Foundation account** → supplier. Delivery is verified by **three parties** (recipient, church, supplier) with photos and serial numbers. Then — and only then — the supplier is paid on invoice + receipt.
7. **Public ledger = the trust engine, made simple.** After each delivery, one row appears publicly: *"TZS 2,600,000 → bought Solar Amplifier 500W → delivered to Sokoni Church, 10 Jun 2026 → receipt INV-2026-0088."* A visitor can check any item in under 10 seconds.
8. **Unfunded at deadline? Redirect, don't waste.** If an item misses its 60-day window, the donor chooses: **move their gift to a similar item** (recommended), **join the Foundation surplus pool** (assigned to the next-nearest item), or **refund to their phone**. Money is never lost and never sits idle.
9. **Every person the applicant and church meet is simple; the complexity lives in the admin.** Applicants apply by a **5-step form or WhatsApp**, the church endorses with a one-page letter (photo via WhatsApp is fine), and everything else is the admin's job.
10. **Trust hooks from world-class platforms, adapted:** item photos before and after delivery, "thank you" impact notes, match campaigns ("your 10,000 becomes 20,000"), and donor receipts that look like a mobile-money receipt.

---

## 1. What the client actually needs (confirmed baseline)

### 1.1 Principles that must never change
| Principle | Implication in the system |
|---|---|
| Never cash to applicants | Money routes donor → provider → OWERU → supplier only |
| Endorsement before review | No request enters review without a church/organisation endorsement (letter or recorded form) |
| All-or-nothing per item | An item either reaches target or is closed and its funds redirected/refunded |
| 60-day funding window | Every item carries a public deadline |
| 24–36 month ownership | Equipment stays in the register as property of OWERU until transfer date |
| Equipment, not grants | Categories: sound, power, printing, shelter, transport, Bibles/literature |
| Privacy & safeguarding | Exposure Open / Partial / Protected; phones, national IDs and exact villages never public |
| Bilingual | English + Swahili, community-first (Swahili default on mobile) |
| Traceability | Every sensitive admin action is audit-logged |

### 1.2 Roles (keep the full set, simplify the surfaces)
| Role | Must do (minimum friction) | Complexity that the platform hides |
|---|---|---|
| **Donor** | Enter phone + amount, confirm PIN | Payment reconciliation, receipts, ledger |
| **Applicant** | 5-step form (or WhatsApp) | Endorsement, review, pricing, publication |
| **Church / Organisation** | Endorse via letter/form + confirm delivery | Verification status, safeguarding rules |
| **Supplier** | Quote, invoice, delivery note | Onboarding, KYC, warranty terms, payment approval |
| **Foundation Admin** | Review, price items, verify delivery, approve payments | Everything else |
| **Recipient** (often = applicant) | Confirm receipt, send 30/90-day report | Overdue tracking, escalation |
| **Regional Leader** | Monitor/spot-check region | Assignments, escalation |

> The donor and the applicant must *feel* the product is "only 3 steps". The admin portal carries the real workflow.

---

## 2. What reality and comparable platforms teach us

### 2.1 Tanzania market reality (2025–2026 data)
| Fact | Source | Design consequence |
|---|---|---|
| 55.8M mobile-money accounts; 5.3B transactions (2023) | IMARC / BoT | Mobile money is the default payment, not an option |
| ~89% mobile-money market share held by M-Pesa, Tigo Pesa, Airtel Money | Tawala 2026 | Must support **all three** networks |
| ~77% of mobile-money volume is USSD on basic handsets; smartphone ownership only ~44.7% | IMARC / TICGL | Donation must work **without smartphone or internet**: USSD and agent-assisted giving |
| 83.4% mobile penetration overall | TICGL 2026 | Reach is through the phone, not the laptop |
| Only ~60% of adults grasp basic financial concepts; trust is a barrier; **wakalas (agents) are the interface** many people rely on | FSDT FinScope / ACM study | Ultra-simple UI, money-agent-approved education, no jargon |
| Tanzania mobile money is **Vodacom M-Pesa**, which uses a **different API** from Safaricom Kenya's | McTaba / GST | ❌ Do **not** reuse Safaricom Daraja code. Use a Tanzanian aggregator |
| Aggregators exist: **Selcom, Azampay, ClickPesa, Pesapal, Tawala, GCA-Pay** — one API for M-Pesa + Tigo Pesa + Airtel Money + cards | McTaba / Tawala | One integration covers all rails; Selcom also has 25k+ POS + bank links |
| Network merchant fees ~0.5–2%; no subscription; merchant onboarding 1–2 weeks per network | Tawala 2026 | Budget for fees; donors may cover (optional) |
| Bank of Tanzania regulates mobile payments; TIPS enables interoperability | BoT 2023 report | Standard rails are compliant; no custom payment engine |

### 2.2 Comparable platforms — what to copy and what to avoid
| Platform | Model | What we copy | What we avoid |
|---|---|---|---|
| **DonorsChoose** (US) | Teachers request real items; donors fund; **org buys & ships; teachers never touch money** | 1) Item-level "fund one item → order when funded" lists. 2) All-or-nothing for whole projects. 3) Unfunded gifts **redirected** rather than refunded. 4) **Match campaigns = highest-leverage growth mechanic.** 5) Titles like "PA system so our village preaching reaches 1,200 people" (item + people + outcome). 6) Thank-you notes + 1-line impact summary per funded item. 7) Leftover/adjustment funds become **credits** for the next request | Full US vendor-catalogue shopping; school IT approval overhead |
| **M-Changa Africa** (Kenya) | Mobile-first crowdfunding, M-Pesa; 4.25% platform fee | 1) Phone-first donation entry. 2) Campaign share via WhatsApp/Facebook. 3) Trust through transparency stats | Flat 4.25% platform fee on small gifts; general-purpose campaigns drift from "buy equipment" discipline |
| **God's Word for Africa / Global Bible Foundation / Africa Bible Fund** | "Sponsor a Bible": priced per item, monthly sowing, impact tiers | 1) **Price the giving unit** ("TZS 25,000 = one Swahili study Bible"). 2) Recurring/monthly sponsorship path (Phase 2). 3) Impact stories with faces and places | Inventory-financing complexity (ABF) not needed in Phase 1 |
| **Build Church Africa** | Western churches/sponsors equip Ugandan refugee churches (furniture, instruments, Bibles) | 1) Church-to-church partnership feel. 2) Physical, named equipment (not generic "programmes") | Spread too thin; keep OWERU's single clear vertical |
| **Changisha / Asante Africa (TZ/EA)** | NGO donation; choose your network (Airtel/Mixx/Halopesa) + instructions; M-Pesa/Tigo/Airtel accepted | **"Choose your network" pattern** so every phone works; agent-era trust | Manual "follow these instructions" flow — replace with STK push instead of copy-paste instructions |
| **GiveSendGo / ChristianGiving / Sowfund** | Faith crowdfunding | Recurring giving, shareable links, QR codes for church presentations | Tax-deduction marketing mechanics (US-centric) |

### 2.3 The core insight from research
> **People donate to a visible object, not to an abstraction.** DonorsChoose succeeded because a donor funds "a set of headphones for room 3B", not "operational budget". Faith platforms confirm it ("$25 = one Bible"). Our winning format: **a photo, a price, a progress bar, and a promise that a real thing will be handed to a real person in a named church.**

### 2.4 Functional-logic benchmark: M-Changa Africa → OWERU (contextualised)
M-Changa is Africa's largest online fundraising platform ("Fundraising Simple. Fast. Transparent."). Full audit below: adopt what fits OWERU's model and money-flow rule (donor → provider → OWERU → supplier), and explicitly **reject** what would break it.

| # | M-Changa mechanism | OWERU adaptation | Status |
|---|---|---|---|
| 1 | Register a campaign online or via USSD `*483*57#`; activate with a small test mobile payment (KES 10–50) that proves the phone | Applicant/org registers; activate by a **token Airtel-Tigo-MPesa STK payment (TZS 500)** that proves ownership of the phone + pre-stages the applicant's mobile-money identity | **Adopt (P1).** Replaces "trust me, it's my number"; mirrors M-Changa's verification-by-transaction |
| 2 | Sharepage: story, target, photos/videos, campaign updates timeline | Request page: story, priced item list, photos; add **public updates timeline** (funded → ordered → delivered → 30/90-day report) so donors watch progress live | Adopt as **item update timeline** (partially built via item statuses) |
| 3 | Due diligence via uploaded documents (medical letter, death cert, chief's letter, org docs) | Already have church endorsement letter + org register; formalise a **30-point-style admin due-diligence checklist** before "Endorsed" | **Adopt (P1)** as admin DD checklist |
| 4 | Up to 3 treasurers must approve any withdrawal (multi-signature) | Already have dual officer sign-off > TZS 3M for supplier payments; extend to **two approvers on every supplier payment** (treasurer model) | Adopt — confirm 2nd approver role (§13 open item) |
| 5 | Mobile-first collection: STK push, M-Pesa Paybill, USSD channel, no-app giving | OWERU rails: Flutterwave STK to M-Pesa/Tigo/Airtel + donor covers network fee (optional); keep 3-tap checkout | **Already built** (3-tap STK pattern) |
| 6 | Live SMS/notification to fundraiser on every donation + automatic digital receipt | Donor auto-receipt exists; add **live donor alert (SMS + email) + live applicant alert per donation** | Adopt + build notifications (partly built) |
| 7 | One-click share everywhere (WhatsApp/Facebook/SMS) with unique campaign link | **Share buttons on every request card and item** with pre-filled message + link (WhatsApp + copy) | **Implemented now** (Requests cards + Funding item cards) |
| 8 | Recurring monthly donations via card | Recurring gift subscriptions | Already planned (Phase 1.5/2) |
| 9 | Withdraw anytime to wallet/bank; campaign runs indefinitely | **Reject.** OWERU never pays applicants; items are all-or-nothing within 60 days (§13 decision). Transparency substitute: item-level status tracking + public ledger | Reject by design |
| 10 | 4.25% platform fee + card 2.5%, fees shown before withdrawal; "no hidden fees" | OWERU platform fee **0%**; network/processing fee shown **at point of donation** (donor may cover). Principle adopted: what you see is what you pay | **Implemented now** (fee note in funding modal) |
| 11 | Community coordinators collect & distribute funds within a community | Church/org layer endorses requests and can back multiple items; no community wallets (lean). Keep org filter per request | Light adoption (org filter exists) |
| 12 | One active fundraiser per SIM/email | One active approved request per church/org at a time (anti-flood) | Already in SRS/schema |
| 13 | Transparency stats: payments, withdrawals, receipts | Public ledger = the headline trust feature; add "instant receipt + live alert" framing | Implemented (receipt + alert copy) |
| 14 | 67% of fundraisers report raising more via the tool | Donation reach = sharing + mobile rails; share buttons carry this weight | See #7 |

**Explicit rejects:** treasurer wallet withdrawal (#9), indefinite open campaigns (#9), flat platform fee (#10), community money pots (#11). These all violate the fixed money-flow invariant and are replaced by OWERU's buy-and-deliver discipline.

---

## 3. The improved concept (what we build differently from the v1 SRS / prototypes)

### 3.1 Design principle: "The system works like M-Pesa, not like a bank app."
Most users first encountered digital money as: dial a short code → choose option → enter amount → confirm on phone. Our donation flow mimics this muscle memory exactly.

### 3.2 Concept pillars
1. **Guest-first checkout (the "3-tap donate").** No login wall. Tap item → tap amount (quick chips: 5,000 / 10,000 / 25,000 / 50,000 / custom) → choose network → STK prompt on donor's phone → done.
2. **Item catalogue instead of campaigns.** Request = list of priced items. Each item: photo, name, why, target, raised, deadline, shares. Public pages show items, not abstract "requests".
3. **Every item has "shares".** `share_price = floor(total / 100)` or a sensible unit (TZS 2,000–5,000). Donors add whole shares; progress displays as "X of 100 shares funded". Low-literacy friendly numbers.
4. **Redirect-not-refund default for expired items** (DonorsChoose rule): on expiry, each donor to that item gets one tap: "Move my 10,000 to a similar item" / "Join the surplus pool" / "Refund to my phone". Auto-redirect to surplus pool when no choice is made, with refund always possible later.
5. **Surplus pool.** Funds from closed/over-funded items sit in a public "Surplus Pool" line of the ledger and are assigned to the next unfulfilled item per region/category; donors are notified of re-assignment. (Exists in the Next.js schema as `Surplus`; make it a headline trust feature, not a back-office detail.)
6. **No over-funding.** Payment initiation is capped at remaining target. If a race produces surplus, it is redirected to the surplus pool, never pocketed.
7. **Match campaigns (Phase 1.5, highest ROI).** Admin enables a match: "Between 1–15 Sep, YOUR 10,000 becomes 20,000 (OWERU matches until 500,000 runs out)". Proven by DonorsChoose to be the single highest-leverage mechanic.
8. **Recipient never leaves WhatsApp.** Application intake, church letter, delivery photos, 30/90-day reports all have a WhatsApp/SMS path that feeds the same database. GUI is convenient; WhatsApp is the guarantee of reach.
9. **Delivery verified three ways before payment.** Recipient confirms + church confirms + supplier confirms (with serial photo). Supplier is paid only after delivery confirmation + invoice + receipt (two-person admin approval for > TZS 3M).
10. **One visible promise: "Check any item on the public ledger."** The ledger is a simple, filterable table of *things bought*, not an accounting dump.

### 3.3 What we deliberately do NOT build (keep lean)
- No donor wallets/escrow inside the platform — funds live with the payment provider until purchase.
- No building of the payment engine — use aggregators (Selcom first, Azampay as backup).
- No full vendor catalogue — admin adds priced items after quotes (like v1 SRS section 10).
- No social chat features — sharing happens on donor's own WhatsApp/Facebook.
- No desktop-first admin UX — admin dashboards are mobile-friendly too (admin may be on a phone in Dar or Mwanza).

---

## 4. User-centred design for Tanzanian users (simplicity rules)

### 4.1 Digital-literacy reality we design for
- Many users are first-time feature-phone mobile-money users; smartphones ~44.7% nationally and lower in rural areas.
- Wakalas/agents are trusted third parties who complete transactions *for* users — the platform must be shareable and simple enough that an agent can complete a donation in minutes.
- Text is English/Swahili; **Swahili is the default language for mobile-visitor surfaces**; icons, photos and big numbers carry meaning.

### 4.2 Universal simplicity rules (apply to every screen)
| Rule | Example |
|---|---|
| One task per screen | Donate screen only ever asks: item + amount + phone |
| Photo-first, numbers big | Item photo > item price in 32px > "Join 47 supporters" |
| Progress = a bar + plain words | "1,500,000 of 2,600,000 TZS · 3 more shares to fund this speaker" |
| Max 3 inputs on any public form | Amount, phone/network, (optional) name |
| No jargon, no banking terms | "Kituo cha kuchangia" instead of "ESP/funding portal" |
| Everything reachable in 2 taps from home | Home lists 3 things: Search items · How it works · Bank account-free giving |
| Every action gives feedback in 1 second | Tap donate → "STK prompt sent to your phone. Enter PIN to confirm." |
| Offline-safe | USSD/SMS fallback stub documented; WhatsApp intake; agent-assisted guidance PDF |

### 4.3 Personas that drive design
- **Mama Neema (52, rural Mwanza, feature phone).** Donates TZS 5,000 via STK the way she pays LUKU. Cannot fill a form. Needs: default Swahili, share-sized amounts, a wakala who can help if stuck.
- **Uncle David (38, diaspora in UK).** Wants a photo, a receipt, and proof. Pays by UK card/international transfer. Needs: card option via aggregator, FX conversion to TZS, emailed receipt, ledger link to share.
- **Pastor John (45, church leader).** Endorses evangelists. Uses WhatsApp daily. Needs: endorse by sending a letter photo; later, confirm delivery with 3 photos.
- **Evangelist Sarah (29).** Applicant and recipient. Low typing confidence. Needs: 5-step guided form or a WhatsApp conversation with an OWERU assistant; photo-based reporting.
- **Ona, wakala in Misungwi.** Her customers trust her to "pay school fees on their phone". She can run the donate flow for a customer if it's simple; she must be able to do a donation in < 3 minutes.

### 4.4 Simplified user journeys
**A. Donor — 3 taps**
```
1 Home → tap a funded item photo
  (see price, share price, progress bar, deadline, church)
2 Tap "Changia / Donate"
  → choose network chip (M-Pesa · Tigo · Airtel) + amount chip (5k/10k/25k/50k/other)
  (optional: "show my name" toggle; default Anonymous)
3 Enter phone number → "Tuma / Send"
  → STK prompt on phone → donor enters PIN → ✓ "Asante! Payment received"
  → optional: Share on WhatsApp · See receipt
```
Failure path: PIN declined / timeout → friendly retry with same number, no data loss.

**B. Applicant — 5 steps (or WhatsApp)**
```
Step 1 Who you are (name, phone, region)
Step 2 Your outreach (what you do, how many reached, how long)
Step 3 What you need (pick from catalogue families or describe; admin prices later)
Step 4 Your church (name, leader)
Step 5 Letter = photo upload OR "church will send letter"
→ WhatsApp/SMS confirmation with a reference code, then "Waiting for church endorsement…"
```
If the phone is a feature phone: send the same 5 questions by SMS/WhatsApp to a human-assisted intake that the admin enters for them.

**C. Church — 2 actions only**
```
Endorse: receive link → confirm "I know this applicant for N years" + upload letter photo → done
Delivery: receive link → see photo of item → confirm "Received in good condition" → done
```

**D. Supplier — 3 actions**
```
Upload quote → deliver + photo + delivery note → upload invoice → track payment status
(onboarding/KYC do once with admin)
```

**E. Admin — the full workflow is here (power user)**
Review queue (endorsement ✓ → approve/decline/ask-more) → price items (from quote) → publish → verify payment webhooks → create order → confirm 3-party delivery → register equipment → approve invoice+receipt payment (single or dual sign-off) → monitor 30/90-day reports → manage ledger & surplus.

---

## 5. The real process (end-to-end, revised)

```
 1 APPLICANT  submits (form or WhatsApp/paper – admin enters)
 2 CHURCH     endorsement letter (photo via WhatsApp OK) recorded & verified
 3 ADMIN      reviews (checks list); marks Approved / Declined / More Info Needed
 4 ADMIN      prices items (from supplier quotes) → items have target, deadline (60d), shares
 5 SYSTEM     publishes items → public funding page (per item, per request)
 6 DONOR      donates via STK (M-Pesa/Tigo/Airtel) or card (diaspora) → auto-confirm via webhook
 7 SYSTEM     credit into Fund Transaction ledger (per item); progress updates; no over-funding
 8 SYSTEM     when item target reached → item "Fully Funded" → notify admin
             when ALL items funded → request → "Funding Closed" → procurement begins
 9 ADMIN/SUP  purchase order → supplier delivers → 3-party confirmation + photos + serial
10 ADMIN      registers equipment (OWR-YYYY-####) & publishes ledger row
11 SYSTEM     pays supplier on invoice + receipt + delivery confirmation (2-person if > TZS 3M)
12 RECIPIENT  30-day report (whatsapp photo ok) → 90-day report → incident path if needed
13 SYSTEM     at 24 months (default; board may set up to 36 per high-value/high-risk item) → transfer proposal; after board approval → ownership transfer
14 SYSTEM     all events audited; ledger and reports public (privacy-aware)
```

**Deadline & surplus rules (formal, client-confirmed)**
- The rule matches this document: at expiry the **donor chooses** — there is no platform-imposed "always refund" and no silent confiscation.
- Item deadline = publish date + 60 days (admin may extend once, logged).
- Before deadline: item closes only when fully funded.
- At deadline partially funded: item closes "Partial".
  - Donor choice every donor sees: Move to similar item (auto-suggested, one tap) · Surplus pool · Refund.
  - No response within 7 days → funds go to surplus pool (reversible refund anytime).
- Fully/over-funded item: excess beyond target → surplus pool (never the applicant).

**Money flow invariant (never broken)**
`Donor → Network/aggregator → OWERU Foundation account → (invoice+receipt+3-party delivery) → Supplier`
No path ever pays an applicant or recipient.

---

## 6. Platforms / screens (product scope)

### 6.1 Public (no login)
| Page | Purpose | Simplicity note |
|---|---|---|
| Home | Mission; featured items; 3-step "How it works" (icons only) | Swahili-first on mobile |
| Search Items | Filter by category, region, progress; big cards | Search box optional; photo cards are the primary UI |
| Item Page | Photo, "why", price, shares, progress, deadline, donors count, Fund button, Share, "What happens after I pay" (3 icons) | The donation CTA is the only primary action |
| Request Page | One applicant's full list of items | Keeps items together for church/context |
| Public Ledger | Table of finalised items: bought, amount, supplier, delivered date, receipt ref | Filter by month/region/category; CSV export for board |
| Reports & Stories | 30/90-day impact notes, thank-yous, photos | "Thank you" = trust × 10 |
| About / Safeguarding / Privacy / Complaints | Policies; safeguarding contact; complaint form | Translations EN/SW |
| How it works | For donors + applicants + churches, each ≤ 4 steps with icons | Reuse for onboarding |

### 6.2 Donor (guest-first, optional account in Phase 2)
- Guest checkout (no account) — the default.
- Donation receipt page (looks like a mobile-money receipt) + option to email it.
- Phase 2: login → donation history, repeat giving, monthly sponsorship.

### 6.3 Applicant / Recipient portal (simple, phased)
- My application (status as a 4-stage progress: Submitted → Endorsed → Review → Funded/Delivered)
- Upload letter photo; resubmit info when asked.
- Delivery confirmation link; 30/90-day report upload (photo or simple form).
- Incident report (3 fields: happened what · date · photo).

### 6.4 Church portal
- Endorsement queue (accept/decline) · delivery confirmations.

### 6.5 Supplier portal
- Profile & KYC · quotes · deliveries · invoices & receipts · payment status.

### 6.6 Admin dashboard (the real power tool)
- Summary cards: requests pending review · items funding · items fully funded · deliveries pending · overdue reports · equipment count.
- Requests queue (filters status/region/program/category; letter viewer; endorsement check).
- Item catalogue & pricing (from quotes) · publish controls.
- Donations monitor (live webhook feed, manual confirm fallback, reconciliation to bank).
- Suppliers · Invoices · Payments (2-person approval) · Equipment register · Reports · Ledger · Users/roles · Audit log · Export CSV/Excel.

---

## 7. Data model (delta on top of existing prototypes)

Reuse the Laravel prototype's tables (donations with mpesa fields, fund_transactions with credit/debit + balance_after, invoices with receipt/approve fields, audit_logs, app_notifications, letters on requests, program_type, item_kind) and add:

| Addition | Why |
|---|---|
| `organizations.type` maintained (church/cross-church org) | Endorsement legitimacy |
| `request_items.share_price`, `share_count`, `shares_funded` | Share-based giving UX |
| `request_items.deadline_extended_at` (once) | Controlled extension, audited |
| `request_items.status` extended: `partially_funded`, `expired`, `surplus_pool` | Deadline/surplus formalisation |
| `fund_redirections` (donation_id → target item / pool / refund, choice, decided_at) | Redirect-not-refund rule |
| `surplus_pool` (balance, history) | Public trust line in ledger |
| `donations.redirect_choice`, `donations.refunded_at`, `refund_reference` | Expiry handling; reversible refunds |
| `match_campaigns` (amount, budget, starts/ends, auto-match flag) | Match mechanic |
| `supplier_quotes` (item, amount, valid_until) — restore from SRS | Pricing source before invoice |
| `delivery_confirmations` (3 parties, times, photos, serial photo) | 3-way verification evidence |
| `recipient_reports` photos + WhatsApp-source flag | Low-tech reporting |
| `ledger_entries` (published rows, visibility) | Simpler than re-deriving ledger from donations |
| FX/card: `donations.currency`, `fx_rate`, `amount_tzs` (already drafted) | Diaspora card giving |

Constraints to keep: unique email/phone where auth; unique register number & serial; positive donation caps at remaining target; audit logs non-editable; FK-protected financial/equipment history; sensitive fields encrypted/access-controlled.

---

## 8. Payments architecture

### 8.1 Recommended choice (client decision: must work in Tanzania **and** worldwide for EU donors): **Flutterwave**
Rationale: one integration covers both worlds — Tanzanian mobile money (M-Pesa/Vodacom TZ, Tigo Pesa/Mixx, Airtel Money, HaloPesa) **and** international cards (Visa, Mastercard, AMEX, Apple/Google Pay) for European/US diaspora donors; settles in TZS; operates in Tanzania, UK, US, EU; donation-friendly (donation/bill products, hosted checkout, webhooks, refunds); sandbox available for development **without full business registration**. FX from card payments stored per donation (`fx_rate`, `amount_tzs`).
No provider account exists yet → start Flutterwave onboarding **in parallel** with P0 dev; simulation mode keeps the demo unblocked in the meantime.
Backups (same interface): **DPO Pay** (Network International — cards + mobile money + multi-currency, NGO-friendly), **Selcom** (widest TZ network coverage incl. Halopesa — TZ-side fallback/dual-rail), then Azampay/ClickPesa/Pesapal.
> ❌ Do **not** port the Safaricom (Kenya) Daraja code from the prototype — wrong rail, wrong country.

### 8.2 Integration contract (keep the prototype's simulation habit)
- Keep `MpesaService` simulation mode pattern (already present) — it lets the whole system be demoed with zero credentials.
- Replace the Safaricom HTTP client with the **Flutterwave client** implementing the same interface: `push(request)` (STK mobile money or card charge), `queryStatus()`, `callback()` (webhook), `refund()`. Provider chosen by `gateway` column; swapping providers is a config change, not a rewrite.

### 8.3 Payment flows
1. **STK push (local donor):** collect amount + phone → aggregator pushes payment request → donor confirms PIN on phone → callback webhook → donation `confirmed` → FundTransaction credit → item progress update → optional donor "thank you" SMS.
2. **Card (diaspora):** hosted checkout via aggregator → pay in USD/EUR/GBP → FX conversion stored (`fx_rate`, `amount_tzs`) → same confirmation pipeline.
3. **Manual/offline (agent or USSD/liter):** donor sends to a published OWERU mobile-money paybill; admin matches reference → confirms. Fallback for low-tech users; also the reconciliation path for bank transfers.

### 8.4 Fees & honesty
- Network fees 0.5–2% (M-Pesa/Tigo/Airtel). Display "fees covered by donor (optional)" at checkout — donors overwhelmingly accept (DonorsChoose model).
- Aggregator adds no per-txn platform fee at typical plans; budget monthly service fees.
- OWERU platform fee: **0%** in Phase 1 (the Foundation's own platform) — a headline trust message.

### 8.5 Reconciliation & safety
- Daily auto-reconciliation report: webhooks matched vs bank statement (GCA-Pay-style "matched ledger" philosophy).
- Manual confirm requires admin + audit log; dual sign-off above TZS 3M (board rule from the operating document).
- Refund API path for expiry choice (recorded + audited).

---

## 9. Trust, safeguarding & privacy

- Public exposure levels Open / Partial / Protected enforced server-side (already in prototype) — keep.
- Never publish: phone numbers, national IDs, exact household/village locations. Public = region/district only.
- Documents (letters, reports) access-controlled; never public by default.
- Delivery evidence (3-party photos, serial plate photo) attached to equipment record; published snippet only after verification.
- Applicant identity at `protected`: strangers cannot even see the request exists (owned by applicant/org + admin).
- Complaint & safeguarding routes are public and low-friction (WhatsApp number + form).
- Children: child-focused funding excluded from Phase 1 (keep).

---

## 10. Non-functional requirements (revised for reality)
| Area | Requirement |
|---|---|
| Mobile-first | All public & donor surfaces designed mobile-first; data-light (target < 1MB page, images lazy-loaded) |
| Performance | Public pages load in < 3s on 3G; API < 1.5s typical |
| Languages | EN/SW with Swahili default for donors; no hard-coded text |
| Observability | Structured logs; reconciliation dashboard; webhook health monitor |
| Security | TLS, RBAC server-side on every protected op, rate-limited auth & donation endpoints, input validation, upload size/type restrictions (prototype already: 8MB, PDF/JPG/PNG/WebP), audit logging, encryption for sensitive fields |
| Backup | Automated DB+file backups with tested restore (weekly) |
| Cost | Target infrastructure + fees budgeted ≤ 2–4% of donation volume; no per-txn platform fee |
| Compliance | BoT mobile-payment norms via licensed aggregators; TRA invoicing handled by Foundation outside platform |

---

## 11. Phased roadmap

| Phase | Scope | Exit criteria |
|---|---|---|
| P0 (Foundation, 2–3 wks) | DB + roles + auth; request & item models; simulation payment service (STK **and** card, sandbox-flavoured); **Flutterwave sandbox onboarding started in parallel**; bilingual shell; **Donor 3-tap STK (simulated)**; Applicant 5-step; Church endorse (letter upload); Admin review queue; **share buttons on request/item cards (WhatsApp + copy)**; **transparent fee note at point of donation** (M-Changa logic §2.4) | Donor can give end-to-end in a demo with simulated STK and simulated card; applicant applies; letter uploads |
| P1 (Go-live, 3–4 wks) | Real **Flutterwave** STK + international card + manual confirm; item pricing from quotes; ledger v1; 3-party delivery + equipment register; invoices/payments; public pages EN/SW; seed 5–8 endorsed requests; **applicant activation by token STK payment**; **admin due-diligence checklist**; **live donor/applicant alerts per donation** | Live donations confirmed via webhook (TZ mobile money **and** EU card); first equipment delivered & on ledger |
| P1.5 (Growth) | Match campaigns (board-approved, cap TZS 1,000,000); share chips; surplus pool & redirect/refund; recurring gift subscriptions | 30-day user test; match campaign shown to lift small gifts |
| P2 (Operations) | 30/90-day & incident reporting with WhatsApp intake; notifications/overdue escalation; recipient/donor dashboards; CSV exports | Reporting loop live for delivered items |
| P3 (Scale) | Monthly sponsorship; mobile app-lite (PWA); deeper aggregator automation; advanced analytics | Board analytics package; regional leader spot-checks |
| P4 (Ownership) | 24-month transfer workflow (board override to 36 per item) with board sign-off; archive & legacy reporting | First ownership transfer processed |

---

## 12. Acceptance criteria (updated, user-centred)

| ID | Test |
|---|---|
| AC-01 | Visitor on a feature phone can donate with phone+amount+network using STK (no account, no email). |
| AC-02 | A donor cannot give more than the remaining target of an item. |
| AC-03 | On expiry, each donor sees one-tap redirect/pool/refund choice; unresponsive funds move to surplus after 7 days and are visible in the ledger. |
| AC-04 | Item progress updates in real-time (webhook) and shows "X of 100 shares". |
| AC-05 | Public pages never show phones, national IDs or exact villages; exposure levels enforced server-side. |
| AC-06 | Supplier is never paid before 3-party delivery confirmation + invoice + receipt; > TZS 3M requires dual approval. |
| AC-07 | Public ledger shows one simple row per bought item (amount, item, supplier, place, date, receipt ref). |
| AC-08 | Match campaign doubles qualifying donations up to its budget and is audited. |
| AC-09 | Applicant can complete the application and send church letter from WhatsApp (assisted path). |
| AC-10 | Recipient can submit a 30-day report with a photo from WhatsApp. |
| AC-11 | Every sensitive action appears in the audit log, non-editable. |
| AC-12 | Admin can export board CSV (funds in, supplier payments, equipment status, reports). |
| AC-13 | Site fully functions in Swahili and English on a 3G connection. |

---

## 13. Client decisions (confirmed, 4 Sep)

| # | Decision point | Confirmed answer | Effect on build |
|---|---|---|---|
| 1 | Payment provider | **Flutterwave** (no existing agreement) — one integration for TZ mobile money **and** worldwide cards. Backup: DPO Pay / Selcom. | Provider-agnostic gateway client; onboarding in parallel with P0; simulation until live |
| 2 | Donor networks | M-Pesa, Tigo Pesa **and** Airtel Money at launch (via Flutterwave rails) | Single STK flow; per-donor phone + network detect |
| 3 | Diaspora cards | **At launch** (many EU donors) — Visa/MC/AMEX hosted checkout, FX stored per donation | Card flow + `fx_rate`/`amount_tzs` are P0/P1, not P1.5 |
| 4 | Over-funding / expiry | **Donor chooses** at expiry: similar item / surplus pool / refund; no response in 7 days → surplus pool; refund always reversible. Matches the document's rule. | Redirect-choice screens + `fund_redirections` + surplus pool are P1.5 (data model from day one) |
| 5 | Match campaigns | Board approves per campaign, capped (TZS 1,000,000) | Match budget + approver recorded in audit log |
| 6 | Ownership transfer | **24 months default**; board may extend to 36 per high-value item | Transfer proposal engine with per-item term |
| 7 | Complaints / safeguarding | Open item — Foundation assigns contact + SLA (48h ack suggested) before go-live | Public complaint route (form + WhatsApp) already in scope |
| 8 | Seeded launch list | Open item — confirm the 5–8 promoted requests before go-live | Seed via admin, not hard-coded |
| 9 | Second approver | Open item — confirm who holds the dual sign-off role above TZS 3M | RBAC-ready; assign role before go-live |
| 10 | Donor name visibility | Open item — recommend anonymous-by-default with opt-in public name | `Exposure`-style flag on donations |

---

## 14. Risk register (updated)
| Risk | Impact | Mitigation |
|---|---|---|
| Aggregator onboarding delay (1–2 wks per network) | High | Start Selcom onboarding in parallel with P0 dev; keep simulation mode so demo never blocks |
| Wrong rail reused (Safaricom) | High | New Tanzania aggregator client; delete Daraja assumptions |
| Low donor digital literacy / mistrust | High | Agent-assisted path, USSD-consistent STK UX, WhatsApp support, printed guide for churches |
| Over-funding / money trapped at expiry | Medium | Cap at target; redirect-default with refund path; surplus pool public |
| Fake endorsements | High | Verified organisation register + endorsement letter + audit |
| Data exposure | Critical | Field-level privacy, server-side exposure checks, access-controlled docs |
| Fraud on manual confirm | Medium | Dual approval > TZS 3M, audit logs, daily reconciliation |
| Scope creep | High | This plan is the freeze; later features land via roadmap only |

---

## 15. Sources consulted
- OWERU SRS Phase One (docs/SRS-OWERU-Phase-One.md) & Phase One operating document (client spec).
- OWERU Laravel prototype (backend/): models, controllers, MpesaService, migrations, routes, seeder — the evolved business logic baseline.
- Tanzania payment reality: IMARC/BoT (55.8M accounts, 5.3B txns), Tawala (TZ payment integration guide, 2026), McTaba (Vodacom M-Pesa vs Safaricom; aggregator landscape; 3-rail checkout), TICGL (smartphone 44.7%), FSDT FinScope (literacy/trust), ACM PhD study (wakala-as-interface), TechCartel / PayAtlas / Boldrails / DPO (TZ gateway landscape).
- Provider for both TZ + worldwide: Flutterwave (TZ mobile money docs + international card docs, donations), DPO Pay (cards+mobile money, NGO), Selcom (widest TZ coverage), ClickPesa (NGO donation product).
- Platforms: DonorsChoose (item funding, redirect policy, match campaigns), M-Changa Africa (functional-logic audit §2.4: activation payment, sharepages, treasurers, live alerts, transparent fees — fetched 4 Sep 2026 from mchanga.africa incl. fees page), God's Word for Africa / Global Bible Foundation / Africa Bible Fund (per-item Bible sponsorship), Build Church Africa, Changisha, Asante Africa.

---

*Prepared as the improved concept & build plan. §13 is now **decided** (client, 4 Sep). Build is unblocked: finalise the P0 data model & backlog, then start the Flutterwave gateway client in simulation mode.*