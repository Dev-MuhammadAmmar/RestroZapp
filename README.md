# RestroZapp

RestroZapp is an offline-first restaurant operations suite:

- `apps/pos-desktop`: Electron, React, Vite, TypeScript, and SQLite.
- `apps/admin-panel`: public website and protected Next.js Owner Console.
- `packages/shared`: shared schemas, types, IPC contracts, and constants.
- `supabase`: database migrations and secure Edge Functions.

See [Deployment and Release Guide](docs/DEPLOYMENT.md) for Supabase, Vercel,
GitHub Releases, Windows installer, and future update commands.

## Current Release

- Version: `1.0.0`
- [Download RestroZapp POS for Windows](https://github.com/Dev-MuhammadAmmar/RestroZapp/releases/latest/download/RestroZapp-POS-Setup.exe)
- SHA-256: `444D446B39F89EC541AB389AEB4D8098D7A841B3A1029DF2C17EC07BE6ED2713`

## Product Layout

Public website:

- `/`
- `/download`
- `/help`
- `/feedback`

Owner-only routes:

- `/admin/login`
- `/admin/overview`
- `/admin/restaurants`
- `/admin/devices`
- `/admin/backups`
- `/admin/versions`
- `/admin/activity`
- `/admin/support`

## Development

```powershell
npm install
npm run dev:admin
npm run dev:pos
```

The website and Owner Console run at `http://localhost:3001`.
Set `RESTROZAPP_SEED_DEMO=1` only when a disposable development database needs
sample catalog data. Production restaurant databases start empty.

## Verification

```powershell
npm run build -w packages/shared
npm run typecheck -w apps/pos-desktop
npm run typecheck -w apps/admin-panel
npm run build -w apps/pos-desktop
npm run build -w apps/admin-panel
npm run test:db-smoke -w apps/pos-desktop
npm audit --omit=dev
```

Do not run `package:win` until the product is ready for installer testing.

To erase all RestroZapp restaurant/application data and Storage objects while
preserving the schema and owner Auth account:

```powershell
$env:CONFIRM_SUPABASE_RESET="DELETE_RESTROZAPP_DATA"
npm run reset:supabase
Remove-Item Env:CONFIRM_SUPABASE_RESET
```

## Desktop Data

- App ID: `com.restrozapp.pos`
- Product name: `RestroZapp POS`
- Windows data root: `C:/RestroZapp`
- Restaurant database: `C:/RestroZapp/{restaurant_code}/restaurant.db`
- Device credentials and activation lease: encrypted with Electron `safeStorage`

The POS saves orders locally before printing or internet work. KOTs, tokens, bills,
reprints, and grocery documents use a durable local print queue. Cloud sync and
snapshots protect successfully uploaded data without becoming part of the billing path.

## Supabase

Project ref: `flrbzrgjsdrwbutkqxsp`

Required server environment:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_FUNCTIONS_URL=
RESTROZAPP_API_BASE_URL=
```

The service-role key is server-only and must never be exposed to Electron or browser code.

Apply database migrations before deploying Edge Functions. The backup hardening release
requires `202606120002_backup_recovery_hardening.sql`, followed by deployment of:

```text
snapshot-upload
snapshot-list
snapshot-download
data-command-poll
data-command-complete
```
