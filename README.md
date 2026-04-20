# CipherTeams

CipherTeams is a production-style team password manager for operations, admin, and IT teams that share critical business credentials securely. It combines a premium UX with vault locking, client-side encryption flows, credential lifecycle tooling, security insights, and export controls.

## Product brief

CipherTeams is built for teams that need one trusted place for shared access without sacrificing security posture. It solves scattered password sharing by combining encrypted vault workflows, practical security health checks, and fast day-to-day credential operations. The product stands out through a polished UX, multilingual support, and trust cues that make security visible without creating noise. In v2, it will extend into richer audit trails, role-based access controls, and stronger policy enforcement.

## Feature set

- Lock/unlock flow with master password onboarding
- In-memory vault key model and encrypted credential storage flow
- Credential CRUD (service, URL, username, password, notes, tags)
- Vault overview with search, filters, sorting, copy/reveal actions
- Password strength indicators and generator
- Reused password detection during unlocked session
- Security Health metrics (reused, weak, stale, missing URL/notes)
- Settings:
  - Master password rotation
  - Auto-lock modes
  - Secure export (JSON/CSV + confirmation)
  - User preferences (theme, locale, density, generator defaults)
- Demo-ready vault onboarding (`Load demo data` from empty state)
- i18n via JSON dictionaries (`uz`, `ru`, `en`)
- Dark/light/system theming

## Tech stack

- Next.js App Router (v15+ compatible architecture)
- TypeScript
- Tailwind CSS
- shadcn/ui composition
- next-intl
- next-themes
- Prisma ORM
- PostgreSQL

## Project structure

```txt
app/
  (workspace)/
    layout.tsx
    vault/
    settings/
  lock/
  page.tsx
  layout.tsx

components/
  layout/
  shared/
  ui/

features/
  auth/
  export/
  password-generator/
  preferences/
  security-health/
  settings/
  vault/

lib/
  auth/
  crypto/
  db/
  i18n/

messages/
  en.json
  ru.json
  uz.json

prisma/
types/
```

## Local setup

1. Copy environment values:

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

4. Apply schema to your database:

```bash
npm run prisma:push
```

5. Start the app:

```bash
npm run dev
```

## Environment variables

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cipherteams?schema=public"
```

## Demo flow

1. Open `/lock` and create a master password.
2. Enter the vault.
3. If the vault is empty, use **Load demo data** to instantly populate realistic sample credentials (including weak/reused/missing-field cases for Security Health demos).

## Security model (current scope)

- Master password is hashed in DB (bcrypt), not stored in plaintext.
- Vault key is derived client-side and kept in memory.
- Sensitive credential fields are encrypted before persistence.
- Reused-password analysis is performed only during unlocked runtime evaluation.

## Docker

```bash
docker build -t cipherteams-web:local .
docker compose up --build
```

## CI/CD

- `.github/workflows/ci.yml` for quality checks on pushes/PRs
- `.github/workflows/cd.yml` for container build/publish flow

## If I had 3 more days

I would add team-level roles and vault permissions, improve session hardening with device-bound unlock policies, and ship a richer Security Health remediation flow that supports bulk password rotation tasks with guided checklists. I would also complete a full test matrix for encryption boundaries and edge-case recovery paths, then finalize performance profiling for large vaults with virtualization and server-side pagination.
