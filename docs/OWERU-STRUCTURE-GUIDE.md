# OWERU Foundation — Structure ya Mfumo Mzima (Kwa Mtu Anayejifunza)

> Hii ni mwongozo rahisi unaoeleza: website ina manga gani, ni nani anaweza kufanya nini, nani ana akaunti ya demo, na ombi la kifaa linakwenda na hatua gani hadi kifaa kinamfikia mlengwa.

---

## SEHEMU YA 1 — Website ya OWERU ina SEHEMU GANI?

Nenda `http://localhost:5173` — website hii ina **sehemu mbili kubwa**:

```
                        ┌─────────────────────────────────────────────┐
                        │            OWERU WEBSITE                    │
                        │        http://localhost:5173                │
                        └───────────────┬─────────────────────────────┘
                                        │
                ┌───────────────────────┴─────────────────────────┐
                ▼                                                 ▼
   ┌───────────────────────────┐                 ┌────────────────────────────────┐
   │  A. SEHEMU YA UMMA         │                 │  B. SEHEMU YA KUFUNGUKA         │
   │  (Hakuna akaunti inahitajika)│               │  (Portal — inahitaji login)      │
   │                           │                 │                                  │
   │  /        — Nyumbani       │                 │  /login       — Ingia           │
   │  /about   — Kuhusu         │                 │  /apply       — Tuma ombi       │
   │  /requests— Maombi         │                 │              (inaweza mgeni!)  │
   │  /requests/:id — Ombi moja │                 │                                  │
   │  /ledger  — Ledger ya Umma │                 │  ✦ ✦ ✦  Baada ya login:        │
   │  /reports — Hadithi/ripoti │                 │                                  │
   │  /safeguarding — Usalama   │                 │  /portal/requests  → Admin/Mgr  │
   │  /privacy — Faragha        │                 │  /portal/applicant → Mwombaji   │
   │  /complaints — Malalamiko  │                 │  /portal/church    → Kanisa     │
   │  /track/:token — Mgeni     │                 │  /portal/donor     → Mtoaji     │
   │    (kufuatilia ombi lake)  │                 │                                  │
   └───────────────────────────┘                 └────────────────────────────────┘
```

**Sheria ya msingi:**
- **Sehemu A (Umma)** — MTU YEYE ANAWEZA KUTAZAMA bila akaunti. Donor anaezaona ombi na hata kuchangia bila kusajiliwa.
- **Sehemu B (Portal)** — inaingilia tu kwa **kupitia login/register**. Hapa ndio kila mtu ana **dashboard yake maalum** kulingana na jukumu lake.

---

## SEHEMU YA 2 — NI NANI ANA DASHBOARD? NI NANI ANAKUTA AMEGENI?

Kuna **watu 4 wa aina tofauti** ambao wanafanya kazi kwenye mfumo, kila mmoja ana mlango wake:

```
                    ┌────────────────────────────────────────────────────┐
                    │      INGIA KUPITIA /login (ROLES 4 + staff)       │
                    └───────────┬───────────┬───────────┬───────────────┘
                                │           │           │               │
             ┌──────────────────┘           │           │               └───────────────────┐
             ▼                              ▼           ▼                                   ▼
┌─────────────────────┐   ┌────────────────────────┐ ┌─────────────────────┐   ┌───────────────────────────────┐
│  DONOR (Mfadhili)    │   │  APPLICANT (Mwombaji)  │ │  CHURCH (Kanisa)    │   │  ADMIN / MANAGER (Staff)       │
│  Dashboard:          │   │  Dashboard:            │ │  Dashboard:         │   │  Dashboard:                    │
│  /portal/donor       │   │  /portal/applicant     │ │  /portal/church     │   │  /portal/requests              │
│  • Historia ya       │   │  • Ombio lake + items  │ │  • Anavipitia       │   │  • Analytics ya maombi         │
│    michango yake     │   │  • Kupokea kifaa       │ │    maombi ya        │   │  • Kuthibitisha (vetting)      │
│  • Jumla ya kile     │   │  • Kufuatilia status   │ │    mwanachama wake  │   │  • Inventory, suppliers,       │
│    alichotoa         │   │  • KYC (uthibitisho)   │ │  • Anathibitisha    │   │    equipment, reports          │
│                      │   │  • Kupeleka ripoti     │ │    (endorsement)    │   │  • ADMIN pekee: users,         │
└─────────────────────┘   │    30/90 siku           │ │                    │   │    donations, invoices, audit  │
                          └────────────────────────┘ └─────────────────────┘   └───────────────────────────────┘
```

**Muhimu — wengine wanaingia "wakiwa mgeni" (bila akaunti):**

```
┌────────────────────────────────────────────────────────────────────────┐
│  MGE NI (Guest) — HAKUNA AKUNTI YA LAZIMA                            │
│                                                                      │
│  1. KUOMBA:  Mtu anaweza kwenda /apply, kujaza jina + simu pekee,   │
│              kuandika ombi. Hakuna email au password inahitajika.    │
│              Anapata kiungo /track/:token cha kufuatilia ombi.       │
│                                                                      │
│  2. KUCHANGIA: Donor anaweza kuchangia bila kusajiliwa — anajaza    │
│              jina + simu tu, au kadi.                                │
│                                                                      │
│  3. KUONA: Umma anaweza kuona maombi, ledger, ripoti, malalamiko    │
│              bila hata login.                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## SEHEMU YA 3 — AKAUNTI ZA DEMO (Emails + Password za kujaribu)

Kwenye mfumo kuna akaunti tayari zilizoundwa (seeder). **Password ya zote ni: `password`**

| Jinsi | Email | Password | Role | Ana-lipia |
|---|---|---|---|---|
| **Msimamizi Mkuu** | `admin@oweru.org` | `password` | admin | `/portal/requests` (anachojua: YOTE) |
| **Meneja** | *andoamElementManager kuundwa na admin* | — | manager | `/portal/requests` (hasi users/donations) |

**Applicants (Mwombaji):**
| Jina | Email | Password | Kanisa/Shule |
|---|---|---|---|
| Neema Mwanga | `neema@matumaini.org` | `password` | Matumaini Health Clinic |
| Upendo Mushi | `mama@imani-dodoma.org` | `password` | Imani Community Church |
| Yosia Mnanka | `yosia@upendo-mwanza.org` | `password` | Upendo Youth Centre |
| Rehema Kileo | `rehema@benki-arusha.org` | `password` | Benki AAC Church |

**Donor (Mfadhili):**
| Jina | Email | Password |
|---|---|---|
| David Kimaro | `donor@example.com` | `password` |

**Church / Endorser (Kanisa — anathibitisha maombi ya wanachama):**
| Jina | Email | Password |
|---|---|---|
| Arusha Youth Mission | `endorser@arushayouth.org` | `password` |
| Imani Community Church | `endorser@imani-dodoma.org` | `password` |
| Benki AAC Church | `endorser@benki-arusha.org` | `password` |

> **Kumbuka:** Kuna pia users wa aina `recipient` na `supplier` (k.m. `baraka@juhudi.ac.tz`, `supplier@dukatiba.co.tz`) — hawa **hawana portal**; wanatumika tu kama data za uhusiano kwenye mfumo.

**Jinsi login inavyofanya kazi:** Mongo yako inaendeshwa na email + password; system inataka jukumu lako na inakupeleka **moja kwa moja** kwenye dashboard yako (`Login.jsx`):
```
admin      → /portal/requests
applicant  → /portal/applicant
church     → /portal/church
donor      → /portal/donor
```

---

## SEHEMU YA 4 — MWOMBAJI: ANZIA → KIFAA KINAMFIKIA MLENGWA (FULL FLOW)

Huu ndio mzunguko mzima wa mfumo. Fuata mishale:

```
            【 HATUA YA 1 — KUOMBA 】
┌────────────────────────────────────────────────────────────────┐
│ MWOMBAJI (mgeni au mwenye akaunti)                             │
│   . Kuna shule/kliniki/kanisa inahitaji kifaa                  │
│   . Anafungua /apply, anajaza:                                 │
│       - Jina + simu (mgeni) au akaunti yake                    │
│       - Hadithi ya ombi, region, kanisa                        │
│       - Vifaa (items) + bei kila kimoja                        │
│   ► OMBIO INAUNDWA, STATUS = submitted                         │
│   ► Mgeni anapata kiungo /track/:token                         │
└────────────────────────────────────────────────────────────────┘
                              ▼
            【 HATUA YA 2 — KUKAGULIWA (Vetting) 】
┌────────────────────────────────────────────────────────────────┐
│ STAFF (admin/manager) anapokea ombi:                           │
│   submitted → under_review → anachunguza taarifa               │
│   (ikiwa kuna kitu kinakosekana → more_info_needed → mwombaji  │
│    anajaza tena)                                               │
│                                                                │
│  ✦ VETTING GATE — ombi HAIWEZI kuapproved bila angalau moja:   │
│     1) Bodi ya OWERU imeithibitisha, AU                         │
│     2) Mwombaji amethibitishwa (KYC 5 hatua), AU                │
│     3) Kanisa limethibitisha (endorsement complete)             │
│                                                                │
│  approved → published  (sasa umma unaweza kuona)                │
└────────────────────────────────────────────────────────────────┘
                              ▼
            【 HATUA YA 3 — UFADHILI (Donor) 】
┌────────────────────────────────────────────────────────────────┐
│ DONOR (mtoaji) anaona maombi kwenye /requests                  │
│   . Anachagua kifaa, anaweka kiasi                             │
│   . Kulipa: M-Pesa / Tigo / Airtel / Card / Bank               │
│     (demo: mfumo unathibitisha baada ya sekunde 4,             │
│      simulated — hakuna pesa halisi)                           │
│   ► Donation = pending → confirmed                             │
│   ► Pesa inaingia LEDGER (FundTransaction CREDIT)              │
│   ► Kifaa kikifikia target 100% → clearly funded               │
│   ► Vifaa vyote vikimalizika → funding_closed                  │
└────────────────────────────────────────────────────────────────┘
                              ▼
            【 HATUA YA 4 — MANUNUZI (Procurement) 】
┌────────────────────────────────────────────────────────────────┐
│ STAFF ananunua kifaa kutoka supplier:                          │
│   invoice pending → markPaid → uploadReceipt → approve          │
│   (approve inakagua kama balance ≥ kiasi — vinginevyo 422)     │
│                                                                │
│   APPROVED → invoice paid, item ordered                         │
│   AUTO → Equipment register (EQ-####, mpokeaji, mahali)         │
│   AUTO → Ripoti za 30-day na 90-day zinaundwa                   │
│   → Notification kwa mwombaji                                   │
└────────────────────────────────────────────────────────────────┘
                              ▼
            【 HATUA YA 5 — UKABIDHIJI + KUANZA KUTUMIA 】
┌────────────────────────────────────────────────────────────────┐
│ KifAA kinafika → Uthibitisho wa PANDETATU:                      │
│    Recipient ✓  Supplier ✓  Kanisa ✓                            │
│   (equipment haiwezi kuwa verified mpaka wote 3 wathibitishe)   │
│                                                                │
│   delivered → in_use → request: delivered                       │
└────────────────────────────────────────────────────────────────┘
                              ▼
            【 HATUA YA 6 — RIPOTI & KUANZIA KWENYENI 】
┌────────────────────────────────────────────────────────────────┐
│ Mwombaji/mlengwa anatuma ripoti za 30-day na 90-day:           │
│   kifaa kinatumika? athari ipo?                                │
│ staff anarekodiwa... -> active_reporting -> closed              │
└────────────────────────────────────────────────────────────────┘
```

---

## SEHEMU YA 5 — CHART YA MJUMBO (ROLES X WANAFANYA NINI)

```
 ROLES              | ANAWEZA KUFANYA                                    | Anayokuambia kwake
--------------------+--------------------------------------------------+-------------------------
 ADMIN              | Yote ya manager + users, donations, payments,     | /portal/requests (yote)
                    | invoices, ledger, audit-logs, exports, staff      |
 MANAGER            | Maombi, items, suppliers, equipment, reports,     | /portal/requests
                    | invoices (hasi staff mgt), verifications          |
 DONOR              | Kuona + kuchangia; historia ya michango yake      | /portal/donor
 APPLICANT          | Kuomba, kufuatilia ombi, KYC, kupeleka ripoti     | /portal/applicant
 CHURCH (endorser)  | Kuona maombi ya kanisa lake, kuthibitisha         | /portal/church
                    | (endorsement)                                     |
```

---

## SEHEMU YA 6 — EWAST MAHALI WA KUFANYIA WEWE

**Public pages** (mgeni bila login):

| Mwongozo | URL | Inafanya nini |
|---|---|---|
| Home | `/` | Utangulizi, maombi yaliyojulikana, takwimu |
| Requests | `/requests` | List ya maombi yaliyochapishwa |
| Ombi moja | `/requests/:id` | Maelezo + kuchangia + maoni |
| Ledger | `/ledger` | Uwazi — invoices zilizolipwa |
| Reports | `/reports` | Hadithi za athari |
| Apply | `/apply` | Tuma ombi (mgeni au akaunti) |
| Complaints | `/complaints` | Malalamiko |

**Login redirects (kila mtu asiyefika dashboard yake automatically):**

```
+--------------------------------------------+
|  ADMIN/MANAGER  → /portal/requests         |
|  APPLICANT      → /portal/applicant        |
|  CHURCH         → /portal/church           |
|  DONOR          → /portal/donor            |
+--------------------------------------------+
```

---

## MUHTASARI WA MZUNGUKO (ONE LINE KILA HATUA)

```
SUBMITTED → UNDER_REVIEW → [GATE: Board/KYC/Church] → APPROVED → PUBLISHED
→ FUNDING (Donor) → FULLY_FUNDED → FUNDING_CLOSED
→ PROCUREMENT (Invoice→markPaid→Receipt→Approve) → EQUIPMENT REGISTER
→ DELIVERY (3-party) → IN_USE → REPORTS 30/90 → CLOSED
```

**Pesa kamwe haimlipi mwombaji.** Flow: `Donor → Payment provider → OWERU → Supplier (kwa kifaa)`. Kila hatua imerekodiwa (audit log), na umma anaweza kuona ledger na ripoti.