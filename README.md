# CipherTeams Foundation

Premium team password manager foundation built with Next.js App Router, TypeScript, Tailwind, shadcn/ui composition, next-themes, next-intl, Prisma, and PostgreSQL.

## Current scope

This stage delivers the product foundation and skeleton:

- App shell (sidebar + topbar + mobile nav)
- Routes:
  - `/` (redirects to `/lock`)
  - `/lock`
  - `/vault`
  - `/vault/new`
  - `/vault/[id]`
  - `/settings`
- Premium UI primitives and reusable composition
- i18n with JSON dictionaries (`uz`, `ru`, `en`) via `next-intl`
- Dark/light/system theme support via `next-themes`
- Prisma schema draft for encryption-ready credential storage and Security Health insights

Business logic (unlock, encryption/decryption, CRUD, export, real analytics) is intentionally deferred for the next implementation phase.

## Project structure

```txt
app/
  (workspace)/
    layout.tsx
    vault/
    settings/
  lock/
  layout.tsx
  page.tsx

components/
  layout/
  shared/
  ui/
  providers.tsx

features/
  lock/
  settings/
  vault/

hooks/
lib/
  db/
  i18n/
messages/
  en.json
  ru.json
  uz.json
prisma/
types/
```

## i18n setup

- Locale source: `pm-locale` cookie
- Default locale: `uz`
- Message files: `messages/{uz,ru,en}.json`
- Runtime config: `lib/i18n/request.ts`

## Docker

### Build image

```bash
docker build -t cipherteams-web:local .
```

### Run full stack (app + PostgreSQL)

```bash
docker compose up --build
```

App runs on `http://localhost:3000`, Postgres on `localhost:5432`.

### Health endpoint

`GET /api/health` is available for container and orchestration health probes.

## CI/CD

GitHub Actions workflows are included:

- `CI` (`.github/workflows/ci.yml`)
  - Runs on PRs and pushes to `main`
  - Executes `npm ci`, `prisma:generate`, `lint`, `build`
- `CD` (`.github/workflows/cd.yml`)
  - Runs on pushes to `main`, version tags (`v*`) and manual dispatch
  - Re-verifies quality gates
  - Builds and pushes Docker image to GHCR: `ghcr.io/<owner>/<repo>`

## Prisma draft models

- `User`
- `Team`
- `TeamMembership`
- `Vault`
- `Credential`
- `CredentialTag`
- `CredentialTagOnRecord`
- `VaultPreference`
- `SecurityEvent`
- `VaultInsightSnapshot`

## Setup

1. Copy env file:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Start development server:

```bash
npm run dev
```
