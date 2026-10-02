# OWERU Build Backlog — P0 (Foundation) + P1 (Go-live prep)

Owner: build session (Azizi / opencode). Source of truth for what is done vs to do.
Master plan & client decisions: `OWERU-Phase-One-Improved-Concept-Plan.md` §11 roadmap, §13 decisions, §2.4 M-Changa benchmark.
Stack: Laravel 12 backend (`backend/`) + React 19/Vite frontend (`frontend/`) + MySQL (`oweru`).

Legend: `[x]` done (verified) · `[ ]` to do · `(ext)` external, needs Foundation/client

---

## P0 — Foundation (2–3 wks). Exit: donor funds an item end-to-end in demo (simulated STK + simulated card)

### 0. Baseline already built (verified 4 Sep 2026)
- [x] 25 migrations applied; DB `oweru` seeded → 9 users, 6 requests, 14 donations, 4 suppliers, 1 equipment delivered
- [x] Backend API v1: public (published/featured/overview/show, donations/fund + mpesa-status + webhook, ledger, letters) + Sanctum auth + full CRUD (requests, items, invoices, equipment, suppliers, reports, notifications, users, audit-logs, donations)
- [x] Money-flow invariant enforced: donor → provider → OWERU → supplier; no cash to applicants
- [x] MpesaService simulation (STK push simulated; SIM-* checkout auto-confirm after ~3s; webhook-shaped callback)
- [x] Public pages (EN/SW): Home, Requests, FundingDetails (STK fund + receipt + share buttons + fee note), Ledger, Reports, About, Login, Safeguarding, Privacy, Complaints
- [x] Admin portals: Requests, Items, Donations, Invoices, Payments, Suppliers, Equipment, Reports, Users, Audit, Ledger
- [x] Applicant portal + Donor dashboard
- [x] AppNotification in-app notifications (donation.confirmed, item.funded)
- [x] EN/SW i18n (Swahili mirrors English on all public pages)
- [x] UI polish pass: Chaga-benchmark share/fee logic on funding page (`FundingDetails.jsx`, `Requests.jsx`)

### 1. Donor donation flow (3-tap UX) — tighten to plan pillars
- [x] **Cap at target (AC-02).** `DonationController::fund` rejects `amount > remaining target` (422) + `lockForUpdate` race guard inside `DB::transaction` — verified live (700,000 over-cap → "only needs 309,322 TZS more")
- [x] **Quick amount chips** on fund modal: 5,000 / 10,000 / 25,000 / 50,000 / custom (TZS) — `FundingDetails.jsx`
- [x] **Network selector + detection** (M-Pesa / Tigo Pesa / Airtel Money) replacing single "mpesa" option; phone prefix auto-detect (071/074→mpesa, 065/067/068/069→tigo, 075/076/078/079→airtel) — verified live
- [x] **Shares display (pillar 3).** Every item shows "X / Y shares · TSh each" + "≈ N shares" hint in fund modal from `share_price` — see §3
- [ ] **3-tap discipline check**: Tap item → tap amount → tap network (STK) → done, no further prompts in happy path

### 2. Card donation (diaspora/EU) — P0 simulation, P1 real
- [x] **Card simulation end-to-end**: card form (EUR/USD/GBP currency, sandbox note) → simulated auth → auto-confirm via same verify path — verified live (`fund id=44` ref `CARD-…`, auto-paid after ~4s; id=46 ref `SIM-CARD-…` auto-paid)
- [x] **FX capture**: stores `currency` + `fx_rate` + `amount_tzs` on donation (columns exist); donor sees "≈ TSh X" — `DonationController`, `api.js`/`FundingDetails.jsx`
- [x] **Webhook/gateway abstraction** (P1-real-ready): `PaymentGateway` interface (initiate + verify) with `SimulatedGateway` (sim STK + card, auto-confirm) and `FlutterwaveGateway` stub (guards: throws unless configured); `config/gateway.php` + `PaymentGatewayManager`; `fund()` + `mpesaStatus()` call the driver — `backend/app/Services/Payments/`
- [x] **Fee transparency on card**: processing-fee note (0% platform, network fee shown before pay) — mirrors M-Changa §2.4 #10

### 3. Item shares model (data)
- [x] Migration/columns: `request_items.share_price` (default `target/100` clamped TZS 2,000–5,000) + backfill — `2026_09_04_000003_add_share_price_to_request_items.php` (applied)
- [x] Expose `share_price`, `shares_funded`, `shares_total` in `published`/`featured`/`show` payloads via `RequestItem` appends — verified live (item 21: share 5,000, 132 total / 69 funded)
- [x] Render shares in card + funding page ("X / Y shares" + "≈ N shares" hint) — `FundingDetails.jsx`; card share buttons (`Requests.jsx`) + fee note done earlier
- [x] i18n keys: copyLink/linkCopied/shareWhatsApp (EN+SW); shares strings localised inline in `FundingDetails.jsx`

### 4. Applicant intake (5-step) + church endorsement
- [x] Verify/complete **Applicant 5-step portal** matches plan §6.3 (org info → needs → evidence → church letter → submit) — new-request form + documents tab exist (portal)
- [x] **Letter upload wired**: `storeLetter`/`viewLetter` exist — applicant attaches + admin approves/rejects in review queue
- [ ] **Admin review queue** = endorse-or-reject with letter + org register check + **reason** (audit logged) — status dropdown + letter actions exist; explicit "reason" field not yet added
- [x] **Admin DD checklist** (M-Changa §2.4 #3): 5-step checklist — National ID, phone, residence, church/org reference, documents — stored in `applicant_verifications` + audit log; **gate: approved/published requires status=verified** — verified live end-to-end (422 until verified, 422 at 4/5 steps, approve+publish after verify). UI: DD chip + modal in `AdminRequests.jsx`, Verification tab in `ApplicantPortal.jsx`
- [ ] **Token STK activation** (M-Changa §2.4 #1): applicant activates via tiny TZS 500 mobile-money token — **P1** (uses same simulated/flutterwave rail as donations)

### 5. Seed launch content (decision §13 #8)
- [x] Seeder: **LaunchRequestsSeeder** — 6 more endorsed/published requests (PA/solar/water/bus/books/sewing) with verified applicant KYC, endorsements, quote-priced items ($share_price set) + partial donations — total 9 published live (Medical/Community/Education/Transport/Livelihood). Run: `php artisan db:seed --class=LaunchRequestsSeeder` (idempotent)
- [x] Confirm each seeded request shows on Home featured + Requests grid + preserves public categories (verified via `/api/v1/requests/published`)

### 6. Live alerts & notifications
- [x] **Live donor alert**: on donation confirmed → email + SMS routes through `NotificationManager`; guest donors with no email get a warning line (they see the receipt inline in-app); registered donors get email — verified live
- [x] **Live applicant alert**: on each confirmed donation (M-Changa §2.4 #6) — email to applicant + SMS to applicant phone (from verification) + in-app `AppNotification` — verified live
- [x] Notification driver interface: `NotificationDriver` (log/mail/sms) + `NotificationManager` + `config/notifications.php`; sandbox default `log` → `storage/logs/alerts-YYYY-MM-DD.log`; swap to real SMTP/TZ aggregator at go-live

### 7. Flutterwave onboarding (ext, parallel)
- [ ] **Sandbox account request** to Foundation/client (no agreement yet — §13 #1) — (ext)
- [x] `config/gateway.php` + `.env` keys layout (sandbox secret, public key, webhook secret) — stub only until account exists
- [x] SSO/test-mode flag so the whole demo runs on simulated gateway without secrets — `PAYMENT_GATEWAY=simulated` default

### 8. Ops & hygiene
- [x] `npm run lint` ↔ `npm run build` green after all P0 work (current: 0 errors / 9 pre-existing warnings)
- [x] Backend tests for `fund()`: over-cap (422), exact-remaining → fully_funded, guest validation, mpesa requires phone, card path + FX + auto-confirm, publish gate (unverified blocked → verified allowed), audit + fund_transaction on confirm — `tests/Feature/DonationFlowTest.php`, **9 tests / 24 assertions green** (`php artisan test`)
- [x] Throttle/security pass: fund 10/min + letters 20/min + KYC submit 20/min; uploads admin-access-controlled via auth:sanctum
- [x] Audit every P0 action (policy: all sensitive ops → `AuditLog::record`) — verification submit/review, request status, donation confirm logged

---

## P1 — Go-live prep (3–4 wks). Exit: live donations via webhook (TZ mobile money + EU card); first equipment delivered & on ledger

- [ ] **Real Flutterwave STK push** (M-Pesa/Tigo/Airtel) replacing simulated STK; webhook + reconciliation per donation (AC-04)
- [ ] **Real card hosted checkout** (Visa/MC/AMEX) with `fx_rate`/`amount_tzs` recorded per donation (§13 #3)
- [ ] **Manual confirm rail** for agent-assisted cash-to-mobile donations (match `payment_reference`, audit trail, dual approver > TZS 3M) (AC-06)
- [ ] **Item pricing from quotes**: supplier quote → item target; quote stored + referenced on item
- [ ] **Ledger v1** (public + admin): one row per bought item (amount, item, supplier, place, date, receipt ref) — AC-07
- [ ] **3-party delivery + equipment register**: recipient + church + supplier confirm (serial photo) before supplier paid; equipment record linked (AC-06)
- [ ] **Invoices/payments workflow**: invoice + receipt upload + approve (dual approval > TZS 3M already coded — verify end-to-end)
- [ ] **Seed 5–8 endorsed requests for launch list** (§13 #8) with quotes
- [ ] **Notification provider live**: SMS + email drivers config, receipts + alerts go out for real
- [ ] **Public pages final EN/SW** + feature-phone check (AC-01, AC-13)
- [ ] **Complaints & safeguarding go-live**: public route + assigned contact + 48h SLA (§13 #7)

## P1.5+ (Growth, backlog only)
- [ ] Redirect/refund choice screens at expiry + `fund_redirections` + public surplus pool (AC-03)
- [ ] Match campaigns (board-approved, cap TZS 1,000,000) (AC-08)
- [ ] Recurring gift subscriptions
- [ ] Ownership transfer (24/36-month) — P4
- [ ] WhatsApp/SMS assisted intake & 30/90-day reporting — P2

---

## Acceptance criteria trace (P0/P1)
| AC | Requirement | Status |
|---|---|---|
| AC-01 | Feature-phone STK donation (no account/email) | [x] simulated STK live (M-Pesa/Tigo/Airtel); USSD/agent rail = P1 |
| AC-02 | Cannot donate > remaining target | [x] cap + race guard verified live |
| AC-03 | Expiry redirect/pool/refund | P1.5 |
| AC-04 | Real-time progress via webhook + shares | [x] shares live (simulated verify); real webhook = P1 |
| AC-05 | Exposure levels server-side | [ ] verify letters/docs access |
| AC-06 | Supplier paid only after 3-party confirm; >3M dual approval | [ ] P1 §3-party |
| AC-07 | Ledger one row per bought item | [ ] P1 ledger v1 |
| AC-08 | Match campaigns audited | P1.5 |
| AC-09 | Applicant via WhatsApp + letter | P2 (assisted) |
| AC-10 | 30-day report with photo via WhatsApp | P2 |
| AC-11 | Every sensitive action in audit log | [x] pattern + tests assert audit on confirm; verification submit/review logged |
| AC-12 | Board CSV export | P2 |
| AC-13 | EN/SW on 3G | [x] mostly; [ ] final sweep |

## Immediate next action (session)
1. Admin review queue: add **reason field** on endorse/reject + letter-scale DD
2. §P1 **Token STK activation** (TZS 500) for applicants on the same gateway rail
3. §P1 **real Flutterwave rails** once sandbox account lands (ext)
4. Frontend sweep: share "Buy 1 share" CTA button on cards + reports/equipment polish
5. Ext: ask Foundation/client for **Flutterwave sandbox account**