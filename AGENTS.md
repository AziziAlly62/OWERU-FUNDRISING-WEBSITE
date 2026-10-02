# OWERU Foundation — project working directory

## Project root
`C:\xampp\htdocs\oweru` (run opencode from here).

## Layout
- `backend/` — Laravel 12 + MySQL API (Sanctum auth). Run: `C:\xampp\php\php.exe artisan serve --port=8001` → http://127.0.0.1:8001
- `frontend/` — React 19 + Vite + Tailwind 4 SPA. Run: `npm run dev` → http://localhost:5173
- `docs/` — SRS and the improved concept & build plan (authoritative client decisions).
- `img/`, `tools/` — assets/scripts.

## Stack notes
- PHP 8.2 at `C:\xampp\php\php.exe` (NOT on PATH — always call with full path).
- MySQL at `C:\xampp\mysql\bin\mysql.exe` (root, no password). DB named `oweru`.
- `oweru-foundation` (Next.js, in OneDrive) is abandoned — do not touch it; prefer the XAMPP project.

## Commands
- **Start everything (recommended):** from project root run
  `powershell -ExecutionPolicy Bypass -File scripts\start-dev.ps1`
  It starts MySQL, the backend on **8001** and Vite on 5173, and skips whatever is already running.
- Backend server alone: from `backend\` run `& "C:\xampp\php\php.exe" artisan serve --port=8001`
  The port is **not** optional: the Vite proxy in `frontend/vite.config.js` targets `127.0.0.1:8001`, so
  a bare `artisan serve` (default 8000) makes every `/api/v1` call return 502 and pages silently render
  as "no requests found".
- Frontend dev: from `frontend\`: `npm run dev`
- Migrations: `& "C:\xampp\php\php.exe" artisan migrate`
- Seed: `& "C:\xampp\php\php.exe" artisan db:seed`

## Product invariants (never break)
- Money flow: Donor → payment provider → OWERU account → supplier. No path pays the applicant/recipient.
- Payment provider = Flutterwave (TZ mobile money + worldwide cards); simulation mode for dev.
- Donations are item-level, all-or-nothing, 60-day window; on expiry donor chooses redirect/pool/refund.