# Tallyco Soft — Project Analysis

## 1. Executive Summary

**Tallyco Soft** (`tallyco-soft`) is a web-based double-entry accounting application inspired by [TallyPrime](https://tallysolutions.com/). It targets small businesses and accountants who need browser-accessible bookkeeping with familiar Tally-style concepts: chart of accounts, vouchers, bill-wise references, and standard financial reports.

The project lives inside the **VK_project** workspace at `tallyco/`. It is in early development (single git commit, functional core features, incomplete local setup documentation until now).

**Repository:** `https://github.com/vikrantpaudel76-lgtm/tallyco.git`

---

## 2. Architecture Overview

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.2.7 (App Router, Server Actions) |
| UI | React 19, Tailwind CSS 4, shadcn/ui (radix-nova) |
| Language | TypeScript 5 |
| Database | PostgreSQL 16 via Prisma 7.8 + `@prisma/adapter-pg` + `pg` |
| Auth | NextAuth v5 beta (credentials provider, JWT sessions) |
| Validation | Zod, react-hook-form |

### Request Flow

```
Browser → middleware.ts (auth + company gate)
        → App Router pages (Server Components)
        → Server Actions (src/lib/actions/*)
        → Prisma Client → PostgreSQL
        → Accounting libs (pure TypeScript calculations)
```

### Folder Structure

```
tallyco/
├── src/
│   ├── app/
│   │   ├── (app)/          # Main shell: dashboard, masters, transactions, reports
│   │   ├── (auth)/login/   # Login page
│   │   ├── (gateway)/companies/  # Company selection / creation
│   │   └── api/auth/[...nextauth]/  # NextAuth API route
│   ├── components/
│   │   ├── forms/          # voucher-form, ledger-form, company-gateway, etc.
│   │   ├── layout/         # app-sidebar, app-header
│   │   ├── reports/        # print-button
│   │   └── ui/             # shadcn components
│   ├── lib/
│   │   ├── accounting/     # voucher, trial-balance, profit-loss, ledger-balance
│   │   ├── actions/        # server actions (auth, company, voucher, ledger, bill, reports)
│   │   ├── auth.ts / auth.config.ts
│   │   ├── db.ts / prisma-client.ts
│   │   └── groups.ts       # default Tally-style ledger groups
│   └── middleware.ts       # Auth + company cookie enforcement
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── docker-compose.yml      # PostgreSQL 16 only
└── package.json
```

### User Flow

```
/login → /companies (select or create company) → /dashboard
       → Masters (Groups, Ledgers)
       → Transactions (Vouchers, Day Book, Bill Index)
       → Reports (Trial Balance, Profit & Loss, Ledger Statement)
```

---

## 3. Feature Inventory

### Routes

| Section | Route | Description |
|---------|-------|-------------|
| Auth | `/login` | Email/password login and registration |
| Gateway | `/companies` | Select or create a company |
| Overview | `/dashboard` | Company stats and quick links |
| Masters | `/masters/groups` | Chart of accounts (ledger groups) |
| Masters | `/masters/ledgers` | Create and manage ledgers |
| Transactions | `/transactions/vouchers` | List vouchers |
| Transactions | `/transactions/vouchers/new` | Create new voucher |
| Transactions | `/transactions/vouchers/[id]` | View voucher detail |
| Transactions | `/transactions/day-book` | Chronological voucher listing |
| Transactions | `/transactions/bills` | Bill-wise references index |
| Reports | `/reports/trial-balance` | Trial balance as of date |
| Reports | `/reports/profit-loss` | P&L for date range |
| Reports | `/reports/ledger/[id]` | Ledger statement |

### Server Actions (`src/lib/actions/`)

| File | Responsibilities |
|------|------------------|
| `auth.ts` | Login, register, sign out |
| `company.ts` | List/create companies, select active company (cookie) |
| `ledger.ts` | Create and list ledgers |
| `voucher.ts` | Create, list, and fetch vouchers |
| `bill.ts` | Bill reference listing |
| `reports.ts` | Trial balance, P&L, ledger statement data |

### Voucher Types

Payment, Receipt, Contra, Journal, Sales, Purchase — each with FY-based auto-numbering (e.g. `PAY-2025-26-0001`).

---

## 4. Data Model

Defined in `prisma/schema.prisma`.

### Entities

| Model | Purpose |
|-------|---------|
| `User` | Email/password authentication; optional `companyId` |
| `Company` | Business entity with FY start month, books begin date, currency (INR default) |
| `LedgerGroup` | Hierarchical chart-of-accounts groups |
| `Ledger` | Individual accounts with opening balance (Dr/Cr) |
| `Voucher` | Typed accounting transaction with FY-based number |
| `VoucherLine` | Debit/credit line items per voucher |
| `BillReference` | Bill-wise tracking linked to voucher lines |

### Enums

| Enum | Values |
|------|--------|
| `GroupNature` | Asset, Liability, Income, Expense |
| `BalanceType` | Dr, Cr |
| `VoucherType` | Payment, Receipt, Contra, Journal, Sales, Purchase |
| `EntryType` | Dr, Cr |
| `BillRefType` | New, Against, OnAccount |

### Relationships

- `Company` has many `LedgerGroup`, `Ledger`, `Voucher`, `BillReference`, `User`
- `LedgerGroup` is self-referential (parent/children hierarchy)
- `Ledger` belongs to one `LedgerGroup`
- `Voucher` has many `VoucherLine`; each line references one `Ledger`
- `BillReference` optionally links to one `VoucherLine`

### Default Groups (on company creation)

Capital Account, Current Assets, Current Liabilities, Fixed Assets, Investments, Loans (Liability), Bank Accounts, Cash-in-Hand, Sundry Debtors, Sundry Creditors, Sales Accounts, Purchase Accounts, Direct/Indirect Expenses, Direct/Indirect Incomes — plus a default "Cash" ledger under Cash-in-Hand.

---

## 5. Accounting Logic

All accounting calculations are pure TypeScript in `src/lib/accounting/` — no external accounting libraries.

### Voucher Validation (`voucher.ts`)

- Requires at least two lines with positive amounts
- Total debits must equal total credits (tolerance: 0.001)
- FY label derived from voucher date and company FY start month
- Auto-numbering: `{TYPE_PREFIX}-{FY_LABEL}-{SEQUENCE}` (e.g. `REC-2025-26-0003`)

### Ledger Balance (`ledger-balance.ts`)

- Sums Dr/Cr movements from voucher lines
- Applies opening balance with Dr/Cr type to produce signed balance
- Used by trial balance, P&L, and ledger statement reports

### Trial Balance (`trial-balance.ts`)

- Iterates all ledgers, computes Dr/Cr closing balance as of optional date
- Returns rows with group name, nature, and totals

### Profit & Loss (`profit-loss.ts`)

- Filters ledgers by Income/Expense group nature
- Computes period amounts within date range
- Income: Cr − Dr; Expense: Dr − Cr

---

## 6. Authentication & Multi-tenancy

### NextAuth (v5 beta)

- **Provider:** Credentials (email + password, bcrypt hashed)
- **Session strategy:** JWT
- **Config:** `src/lib/auth.config.ts` (pages, callbacks)
- **Handlers:** `src/lib/auth.ts` (authorize against `User` table)

### Company Context

- Active company stored in cookie `tallyco-company-id` (`src/lib/company-cookie.ts`)
- Session callback merges cookie value into `session.user.companyId`
- Company selection via `selectCompany` server action sets the cookie

### Middleware Rules (`src/middleware.ts`)

1. `/api/auth/*` — always allowed through
2. Not logged in + not on `/login` → redirect to `/login`
3. Logged in + on `/login` → redirect to `/companies`
4. Logged in + no company cookie + not on `/companies` → redirect to `/companies`
5. Otherwise → allow request

---

## 7. Configuration Reference

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | NextAuth JWT signing secret |

Example (see `.env.example`):

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tallyco"
AUTH_SECRET="your-random-secret-here"
```

### Docker (`docker-compose.yml`)

PostgreSQL 16 Alpine on port `5432`:

- User: `postgres`
- Password: `postgres`
- Database: `tallyco`
- Volume: `tallyco_pgdata`

### NPM Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Start development server |
| `build` | `prisma generate && next build` | Production build |
| `start` | `next start` | Run production server |
| `lint` | `eslint` | Lint codebase |
| `db:generate` | `prisma generate` | Generate Prisma client |
| `db:migrate` | `prisma migrate dev` | Create/apply migrations |
| `db:push` | `prisma db push` | Push schema without migrations |
| `db:seed` | `npx tsx prisma/seed.ts` | Seed demo user |
| `db:studio` | `prisma studio` | Open Prisma Studio GUI |

---

## 8. Known Issues & Technical Debt

| Issue | Severity | Notes |
|-------|----------|-------|
| No Prisma migrations | Medium | Schema applied via `db:push`; no `prisma/migrations/` history |
| Boilerplate README | Low | Default create-next-app README; use this file for project docs |
| Unused dependencies | Low | `@tanstack/react-query`, `recharts`, `@react-pdf/renderer` not imported |
| No tests | Medium | No test runner or test files configured |
| Company not scoped per user | Medium | `getCompanies()` returns all companies, not user-specific |
| `.tools/node/` committed | Low | ~100MB Windows Node bundle; not useful on macOS/Linux |
| NextAuth v5 beta | Low | On beta release; monitor for stable release |
| Print via browser only | Info | `print-button.tsx` uses `window.print()`, not PDF renderer |

---

## 9. Setup Guide

### Prerequisites

- Node.js 18+ (recommended: 20+)
- Docker (for PostgreSQL)
- npm

### Steps

```bash
# 1. Enter project directory
cd tallyco

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and set AUTH_SECRET (generate with: openssl rand -base64 32)

# 4. Start PostgreSQL
docker compose up -d

# 5. Apply database schema and seed demo user
npm run db:push
npm run db:seed

# 6. Start development server
npm run dev
```

Open `http://localhost:3000` in your browser.

### First-time Usage

1. Sign in with demo credentials (see section 10)
2. On the company gateway, create a new company or select an existing one
3. Default ledger groups and a "Cash" ledger are created automatically
4. Navigate via the sidebar to create ledgers, enter vouchers, and view reports

---

## 10. Demo Credentials

Seeded by `prisma/seed.ts`:

| Field | Value |
|-------|-------|
| Email | `admin@tallyco.local` |
| Password | `admin123` |

The seed script is idempotent — it skips creation if the user already exists.
