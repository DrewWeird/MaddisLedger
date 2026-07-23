# MaddisLedger

Stock and point-of-sale system for **Maddi's Sweet Temptations**. A Windows desktop app (Electron) with a React frontend, a .NET 8 backend (EF Core + MySQL), and PDF invoices/delivery notes generated with QuestPDF.

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

Releases are built by `.github/workflows/release.yml` on any pushed tag matching `v*`. It publishes the backend as a self-contained win-x64 single-file executable, builds the frontend into the backend's `wwwroot`, and packages everything with `electron-builder`, publishing the installer and `latest.yml` to GitHub Releases — which `electron-updater` reads to auto-update installed copies of the app.

To cut a release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Key design notes

- No VAT/tax anywhere; currency is ZAR.
- Delivery notes are always created from an existing invoice (supports partial deliveries).
- Stock decrements when an invoice is created and is restored if the invoice is voided. Overselling is allowed with a warning, never blocked.
- Invoices/delivery notes are never hard-deleted — only voided, preserving sequential numbering (`INV-0001`, `DN-0001`).
- PDFs are generated server-side by QuestPDF and stored under the app's data directory; paths are persisted on the invoice/delivery note record.
