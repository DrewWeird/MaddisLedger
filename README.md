# MaddisLedger

Stock and point-of-sale system for **Maddi's Sweet Temptations**. A Windows desktop app (Electron) with a React frontend, a .NET 8 backend (EF Core + MySQL), and PDF invoices/delivery notes generated with QuestPDF.

## Features

- **Stock**: category/name/size variants (e.g. Chutney → Appelkoos → 500g), quantity on hand/on order, reorder-level low-stock alerts, selling price and cost price (for margin tracking). Code auto-fills from Category/Name/Size while creating a new item (editable, always uppercase).
- **Customers & Invoices**: saved customer list with a default currency (ZAR or USD), invoices built from stock items with live-calculated line/grand totals. Stock decrements on invoice creation and is restored automatically if voided; overselling is allowed with a warning, never blocked. Invoices/delivery notes are never hard-deleted — only voided, preserving sequential numbering (`INV-0001`, `DN-0001`).
- **Multi-currency invoicing**: invoices can be issued in ZAR or USD using a live exchange rate from [Frankfurter.dev](https://api.frankfurter.dev) (free, no API key), always manually overridable and snapshotted onto the invoice at creation time — historical invoices and reports never change when the live rate moves later.
- **Delivery notes**: always generated from an existing invoice, supporting partial deliveries across multiple notes.
- **Suppliers, supplier invoices & payments**: a financial-record-only expense tracker (no stock effect, no PDF, no numbering sequence) with partial-payment support.
- **Reports & Dashboard**: a simple accrual-basis income vs. expenses summary (revenue, COGS, gross profit, other expenses, net profit) for a date range, plus revenue/expenses trend and revenue-by-category charts. Dashboard shows a sales trend chart and low-stock alerts.
- **PDFs**: generated server-side by QuestPDF (invoice/delivery note), opened via the OS's default PDF viewer (see *PDF opening* below).
- **Branding**: the Mantine theme uses colors extracted from the business logo; the sidebar shows the actual logo.
- **Auto-update**: the packaged app checks GitHub Releases on launch and shows in-app notifications while downloading/ready to install (see *Auto-update* below).

## Project layout

```
backend/    .NET 8 Web API (EF Core, Pomelo MySQL provider, QuestPDF)
frontend/   React + Vite + TypeScript SPA
electron/   Electron shell (splash screen, DB setup, packaging, auto-update)
```

## Prerequisites

- .NET 8 SDK
- Node.js 20+
- A running MySQL 9.7.1 server (the app does not bundle or manage MySQL)

## Backend setup (first time)

```bash
cd backend
dotnet tool restore                    # installs the pinned dotnet-ef version
cp src/MaddisLedger.Api/appsettings.Development.json.example \
   src/MaddisLedger.Api/appsettings.Development.json
# edit appsettings.Development.json with your local MySQL connection string
cd src/MaddisLedger.Api
dotnet dotnet-ef database update       # applies migrations (also happens automatically on startup)
```

## Running each piece in development

**Backend** (http://127.0.0.1:5217, Swagger at `/swagger`):

```bash
cd backend/src/MaddisLedger.Api
ASPNETCORE_ENVIRONMENT=Development ASPNETCORE_URLS=http://127.0.0.1:5217 dotnet run
```

**Frontend** (http://localhost:5173, proxies `/api` to the backend):

```bash
cd frontend
npm install
npm run dev
```

**Electron shell** (spawns the backend itself and loads the Vite dev server in dev mode):

```bash
cd electron
npm install
npm run build
npx electron .
```

On first launch, Electron shows a Database Setup screen to collect MySQL connection details and writes them to `config.json` in its userData folder. Delete that file to see the first-run flow again.

## Building a release

Releases are built by `.github/workflows/release.yml` on any pushed tag matching `v*`. It publishes the backend as a self-contained win-x64 single-file executable, builds the frontend into the backend's `wwwroot`, and packages everything with `electron-builder`.

The workflow pre-creates the GitHub release as a **draft** before running `electron-builder`, then explicitly publishes it afterwards — `electron-builder` uploads the installer/blockmap/`latest.yml` as parallel tasks that race on "does the release exist yet," and letting it create the release itself (or handing it an already-*published* release) either crashes on a 422 or silently skips uploading. Pre-create-as-draft-then-publish is the only combination that reliably works; if you change this workflow, keep that order.

To cut a release:

```bash
git tag v0.1.5
git push origin v0.1.5
```

If a tag's build fails and you need to retry against a fixed commit, delete both the remote tag and (if one was created) its GitHub release before re-pushing the tag — re-pushing an unchanged tag name doesn't reliably re-trigger the workflow.

## Known operational notes

- **No code-signing certificate.** This is a small private project, so the installer isn't signed. On a Windows machine with **Smart App Control** enabled, the installer will be blocked outright with no per-file override — the only way through is disabling Smart App Control entirely (Windows Security → App & browser control → Smart App Control settings → Off), which Microsoft states can only be re-enabled via a clean Windows reinstall. Plain **SmartScreen** (the more common "Windows protected your PC" popup) instead offers a per-file "More info → Run anyway" and doesn't require this. Worth revisiting if the certificate becomes affordable later — it would remove this friction entirely and make auto-update fully silent.
- **PDF opening uses `shell.openPath`, not Electron's built-in PDF viewer.** An earlier approach (opening PDFs in a same-origin popup window using Chromium's built-in viewer via `webPreferences.plugins`) worked in dev on macOS but not in the packaged Windows build — Electron's built-in PDF viewer has long-standing reliability issues in fresh `BrowserWindow`s (see `electron/src/main.ts`'s `shell:open-path` handler for the full explanation). Opening the actual file with the OS's own PDF viewer sidesteps this entirely.
- **Auto-update logs** are written via `electron-log` to the standard per-OS app log location (on Windows: `%APPDATA%\MaddisLedger\logs\main.log`) — check there first if an update silently doesn't seem to happen, since `electron-updater` itself is otherwise silent on failure.
- **CI installs with `npm install`, not `npm ci`.** A `package-lock.json` generated on macOS has twice been missing a Windows-only `optionalDependencies` entry (most recently `@emnapi/core`, pulled in transitively by Vite's Rolldown bundler), which makes `npm ci`'s strict lockfile-must-match-exactly check fail on the `windows-latest` runner despite installing fine locally. `npm install` resolves correctly per-platform without needing the committed lockfile to already be a cross-platform superset.

## Key design notes

- No VAT/tax anywhere. ZAR is the business's home currency; USD is supported per-invoice with a snapshotted exchange rate (see *Multi-currency invoicing* above). All cross-currency reporting (Dashboard "Sales Today", Reports) converts to ZAR using each invoice's own snapshotted rate, never a live one.
- Cost price is snapshotted onto each invoice line (`CostPriceSnapshot`) alongside the existing `UnitPriceSnapshot`, so later cost changes never rewrite historical margin/profit reporting. It's internal only and never appears on customer-facing PDFs.
- Reports/Dashboard figures are accrual-basis: revenue and expenses are recognized on invoice/supplier-invoice issue date, not on payment date.
- PDFs are generated server-side by QuestPDF and stored under the app's data directory; the absolute path is persisted on the invoice/delivery note record and used directly by `shell.openPath` (see *Known operational notes*).
