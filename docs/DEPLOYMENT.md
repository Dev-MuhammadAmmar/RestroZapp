# RestroZapp Deployment and Release Guide

This guide covers the RestroZapp website, Owner Console, Supabase backend, and
Windows POS installer.

## Requirements

- Node.js 22 or later
- npm 11 or later
- Git
- A Supabase project
- A Vercel project connected to this repository
- GitHub CLI for release publishing: `winget install GitHub.cli`
- Optional but recommended: a Windows code-signing certificate

Run commands from the repository root:

```powershell
cd "C:\Users\lenov\OneDrive\Desktop\More\unsa_restaurant"
npm install
```

## Local Development

Start the website and Owner Console:

```powershell
npm run dev:admin
```

Open `http://localhost:3001`.

Start the Electron POS in development:

```powershell
npm run dev:pos
```

## Environment Variables

Create `apps/admin-panel/.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Add the same variables to the Vercel project. Never commit `.env.local` or the
service-role key.

## Supabase Deployment

Authenticate and link the project:

```powershell
npx supabase login
npx supabase link --project-ref flrbzrgjsdrwbutkqxsp
npx supabase db push
```

Deploy all Edge Functions:

```powershell
Get-ChildItem "supabase/functions" -Directory |
  Where-Object { $_.Name -ne "_shared" } |
  ForEach-Object {
    npx supabase functions deploy $_.Name --project-ref flrbzrgjsdrwbutkqxsp
  }
```

Create the owner in Supabase Auth, then set:

```json
{
  "role": "owner"
}
```

in the user's `app_metadata`. Owner access is restricted to
`ammarproduction56@gmail.com`.

## Website Deployment

The repository includes root `vercel.json` configuration for the Admin workspace.
Connect `Dev-MuhammadAmmar/RestroZapp` to Vercel and deploy:

```powershell
npx vercel login
npx vercel link
npx vercel --prod
```

Assign `restrozapp.vercel.app` in Vercel project domains. The public installer
page is:

```text
https://restrozapp.vercel.app/download
```

## Verification Before Packaging

```powershell
npm run verify
```

This builds shared code, the website, and the POS, then checks a temporary SQLite
database. Do not package a release when these checks fail.

## Build the Windows Installer

```powershell
npm run package:win
```

Output:

```text
apps/pos-desktop/release/RestroZapp-POS-Setup.exe
```

The installer creates a per-user Windows installation and a desktop shortcut
named `RestroZapp POS`.

Without a commercial code-signing certificate, Windows SmartScreen may show an
unknown-publisher warning. The application icon and installer still work, but a
trusted certificate is recommended before broad customer distribution.

## Publish a GitHub Release

Install and authenticate GitHub CLI once:

```powershell
winget install GitHub.cli
gh auth login
```

Publish the current installer:

```powershell
gh release create v1.0.0 `
  "apps/pos-desktop/release/RestroZapp-POS-Setup.exe" `
  --repo Dev-MuhammadAmmar/RestroZapp `
  --title "RestroZapp POS 1.0.0" `
  --notes "Initial production release of RestroZapp POS."
```

The permanent latest-release URL used by the website is:

```text
https://github.com/Dev-MuhammadAmmar/RestroZapp/releases/latest/download/RestroZapp-POS-Setup.exe
```

Publish the release in Supabase so the website and POS update checker show the
correct version:

```powershell
npm run release:publish-record -- `
  1.0.0 `
  "https://github.com/Dev-MuhammadAmmar/RestroZapp/releases/download/v1.0.0/RestroZapp-POS-Setup.exe" `
  "Initial production release."
```

## Future POS Updates

For version `1.1.0`:

```powershell
npm run version:set -- 1.1.0
npm install --package-lock-only
npm run verify
npm run package:win
git add .
git commit -m "Release RestroZapp POS 1.1.0"
git push origin main
git tag v1.1.0
git push origin v1.1.0
gh release create v1.1.0 `
  "apps/pos-desktop/release/RestroZapp-POS-Setup.exe" `
  --repo Dev-MuhammadAmmar/RestroZapp `
  --title "RestroZapp POS 1.1.0" `
  --notes "Describe the release changes here."
npm run release:publish-record -- `
  1.1.0 `
  "https://github.com/Dev-MuhammadAmmar/RestroZapp/releases/download/v1.1.0/RestroZapp-POS-Setup.exe" `
  "Describe the release changes here."
```

Because the installer filename remains stable, `/download` always works through
GitHub's latest-release URL after each release is published.

## Fresh Supabase Reset

This deletes all restaurant/application data, Storage files, and non-owner Auth
users. It preserves the schema, Edge Functions, signing key, and owner account:

```powershell
$env:CONFIRM_SUPABASE_RESET="DELETE_RESTROZAPP_DATA"
npm run reset:supabase
Remove-Item Env:CONFIRM_SUPABASE_RESET
```

Do not run this command against a live customer system.
