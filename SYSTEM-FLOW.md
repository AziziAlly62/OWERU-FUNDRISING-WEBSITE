# OWERU Foundation — Whole System Flow (Application → Recipient)

Flow hii imetokana moja kwa moja na code iliyopo (backend controllers + frontend routes).
Statuses na gates zote ni zile zinazotumika kwenye system.

## Roles & wajibu wao

| Role | Ngazi | Anachotakiwa kufanya |
|---|---|---|
| **admin** | OWERU | Yote ya staff + anasimamia staff (users), donations, payments, invoices, ledger, audit-logs. Ana record Board decision (`board_approved`), anaweza fanya due-diligence ya applicant (5 steps), anaidhinisha invoice, anareview reports. Yeye tu anaweza ku-create admin/manager. |
| **manager** | OWERU | Requests, items, suppliers, equipment, reports. Aunza/publish, ana-create invoices, anasend `markPaid`, anapakia `uploadReceipt`. Hawezi simamia staff au kuona donations zote bila admin scope. |
| **applicant** (Mwombaji) | Outside | Anasajili akaunti (huanza kama `donor`), anatuma ombi kupitia `/apply`, anaendelea kufuatilia status na notifications (`item.funded`, `invoice.paid`, `request.status`). ANA POKEA kifaa (recipient). Anayatoa 30/90-day monitoring reports. |
| **donor** (Mtoaji) | Outside | Anaweza kutoa (`/requests/:id` → fund), anaona donations zake tu (DonorDashboard). Self-registration inaweza ku-create **donor pekee** — hakuna escalation. Pia anaweza kuwa mwombaji akiformu ombi. |
| **endorser** (Kanisa) | Outside | Mchungaji/representative wa kanisa aliloorodheshwa katika ombi. Anathibitisha ombi la mwanachama wake (`Endorsement` → `complete`). ChurchPortal. |

## Status transitions (kenyecode backend - RequestController.updateStatus)

```
draft ──► submitted ──► under_review ──► approved ──► published ──► funding_closed
                  ▲         │               │              │
                  └─ more_info_needed ──────┴──────────────┘
funding_closed ──► procurement ──► delivered ──► active_reporting ──► closed
```

Rules enforced kwenye backend:
- `approved → published` inahitaji **angalau mojawapo**: `board_approved` (admin) A U applicant `verification.status === verified` (5-step DD) A U church confirmation `complete` (endorser) — la sivyo `422`.
- `published → funding_closed`: inafunguka automatically pale item zote zikifika target (`fully_funded`), au admin/manager anaweza kufunga.
- Badiliko lolote lisilo kwenye ramani hapo juu → `422 Invalid status transition`.

## mermaid flow chart

```mermaid
flowchart TD
    A([MWOMBAJI - mwanachama / mwanamma]) -->|1. Anasajili akaunti ya donor & anajaza ombi| B[Apply /apply]
    B --> C{status: submitted}
    C --> D[[ADMIN / MANAGER - review]]
    D -->|more_info_needed| C
    D --> E{VETTING GATE - angalau moja}
    E --> F[1. Board decision - admin]
    E --> G[2. Due-diligence 5 steps - admin]
    E --> H[3. Church confirmation - endorser]
    F & G & H -->|ndiyo| I{status: approved}
    I --> J{Publish}
    J --> K[[PUBLIC - /requests, /requests/:id]]

    K --> L([DONOR - anatoa])
    L --> M[fund: item lock + remaining check]
    M --> N{Malipo yetumwa}
    N -->|simulated 4s | Daraja STK | Flutterwave card| O[Donation: confirmed]
    O --> P[(FundTransaction CREDIT<br/>item balance na cash account)]
    O --> Q{Item inafika target?}
    Q -->|ndiyo| R[Item: fully_funded]
    R --> S{Item zote funded?}
    S -->|ndiyo| T[Request: funding_closed]

    P --> U[[ADMIN / MANAGER - procurement]]
    U --> V[Invoice store: pending]
    V --> W[markPaid: awaiting_receipt]
    W --> X[uploadReceipt: receipt_uploaded]
    X --> Y{approve - balance ≥ amount?}
    Y -->|hapana 422| U
    Y -->|ndiyo| Z[(FundTransaction DEBIT<br/>invoice: paid, item: ordered)]
    Z --> AA[Auto: equipment register<br/>EQ-#### + recipient + location]
    AA --> AB[Auto: 30-day + 90-day reports<br/>scheduled]
    Z --> AC[Notification - applicant]

    AA --> AD[[DELIVERY - mpokeaji]]
    AD --> AE[Equipment: delivered / in_use / in_repair]
    AE --> AF[[Applicant - 30 & 90 day reports]]
    AF --> AG[ADMIN - reviews reports]
    AG --> AH[status: delivered → active_reporting]
    AH --> AJ{{status: closed}}

    DEV[AUDIT LOG - kila action staff]<-->D
    DEV<-->U
    LED[(PUBLIC LEDGER - /ledger<br/>invoices paid + transactions)]<-->Z
    STA[(STATS - donations total, overview)]<-->P
```

## ASCII flow chart

```
MWOMBAJI ──► /apply ──► submitted ──► under_review ──► VETTING GATE (angalau moja)
              │                                          │
              ◄── more_info_needed ◄─────────────────────┘
                                                        │
                1. board_approved (admin)               │
                2. verification verified (admin, 5 DD)  │
                3. church confirmed (endorser)          │
                                                        ▼
                                          approved ──► published ──► PUBLIC (requests page)
                                                                        │
                                                                        ▼
                                          DONOR fund ──► payment (simulated/Daraja/Flutterwave)
                                                                        │ confirmed
                                                                        ▼
                                          FundTransaction CREDIT ──► ledger + cash account
                                                                        │ item inafika target?
                                                                        ▼ ndiyo
                                                                   item fully_funded ──► (zote?) ──► funding_closed
                                                                        │
                                                                        ▼
                                          ADMIN/MANAGER: invoice pending ──► awaiting_receipt ──► receipt_uploaded
                                                                        │ approve: balance ≥ amount?
                                                                        ▼ ndiyo
                                          FundTransaction DEBIT ──► invoice paid, item ordered
                                                                        │
                                                                        ▼
                                          AUTO: equipment register (EQ-####, recipient, location)
                                                                        │
                                          AUTO: 30-day + 90-day monitoring reports scheduled
                                                                        │
                                                                        ▼
                                          DELIVERY ──► Mpokeaji apokea (equipment delivered/in_use/in_repair)
                                                                        │
                                                                        ▼
                                          Applicant anatuma 30/90-day reports ──► admin areview
                                                                        │
                                                                        ▼
                                          delivered ──► active_reporting ──► closed
```

## Money accounting (muhimu sana)

- **credit** — donation inapothibitishwa (confirmed) → `FundTransaction CREDIT` kwa item hiyo. Hii ndiyo inaongeza balance ya item.
- **debit** — invoice inapoidhinishwa (approve) → `FundTransaction DEBIT`. `approve` hawezi pitia kama `balance < amount` (422 "Insufficient confirmed funds").
- ledger ya public `/ledger` inajenga kutoka invoices zilizolipwa; admin ledger kutoka FundTransactions.
- M-Pesa / card kwa sasa ni **simulated** (hakuna ma-keys ya Daraja/Flutterwave) — demo flow inafanya kazi bila pesa halisi.

## Security notes zilizothibitishwa kwenye code

- Self-registration → `donor` pekee (hakuna escalation). Staff (admin/manager) huundwa na **admin pekee** (`admin/manager` validation).
- Staff endpoints zote zina guard ya role; donations index imepunguzwa kuwa `donor_id` kwako kama si admin/manager.
- Endorsement lazima lilingane na church organization ya ombi (endorser) au staff.
- Kilahatua cha staff kimeandikwa kwenye **AuditLog**.