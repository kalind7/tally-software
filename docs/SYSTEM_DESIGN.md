# Tallyco Soft — System Design (Nepal, Voucher-First)

## Product goal

Tallyco is a browser-based double-entry accounting app for Nepali small businesses. The **primary workflow is voucher entry**, not ledger setup. Beginners should record transactions immediately; ledgers are either pre-seeded or created inline (Alt+C).

```
Voucher Entry → Ledger Auto-Posting → Trial Balance → Profit & Loss
```

---

## 1. User & company access model

### Roles

| Role | Access |
|------|--------|
| `ADMIN` | Sees **all** companies; can select any company |
| `USER` | Sees only companies where `Company.ownerId = User.id` |

### Schema

```
User (role: ADMIN | USER)
  └── ownedCompanies[]  (Company.ownerId)

Company
  ├── ownerId → User
  ├── ledgerGroups, ledgers, vouchers
  └── currency default NPR
```

### Enforcement points

| Layer | File | Rule |
|-------|------|------|
| List companies | `src/lib/access.ts` → `getCompaniesForUser()` | Filter by owner unless admin |
| Select company | `src/lib/actions/company.ts` → `selectCompanyAction()` | `requireCompanyAccess()` |
| All app pages | `src/lib/session.ts` → `requireCompany()` | Access check on active company |
| Create company | `createCompany()` | Sets `ownerId` to current user |

### Demo users

- **Admin:** `admin@tallyco.local` / `admin123` (seed sets `role: ADMIN`)
- **Normal users:** register via `/login` → default `role: USER`

---

## 2. Module structure

```
src/
├── app/
│   ├── (auth)/login/              # Login & registration
│   ├── (gateway)/companies/       # Company select/create (scoped by role)
│   └── (app)/
│       ├── dashboard/             # Voucher-first overview
│       ├── transactions/
│       │   ├── vouchers/new/      # ★ Main entry point
│       │   ├── vouchers/          # List & detail
│       │   ├── day-book/
│       │   └── bills/
│       ├── reports/
│       │   ├── trial-balance/     # Real-time from voucher lines
│       │   └── profit-loss/
│       └── masters/
│           ├── groups/
│           └── ledgers/           # Optional — not required before vouchers
├── components/
│   ├── forms/
│   │   ├── voucher-form.tsx       # Voucher UI + inline ledger (Alt+C)
│   │   ├── ledger-form.tsx
│   │   └── company-gateway.tsx
│   └── layout/app-sidebar.tsx     # Voucher-first nav order
├── lib/
│   ├── access.ts                  # Role-based company access
│   ├── groups.ts                  # Nepal COA seed + starter ledgers
│   ├── accounting/
│   │   ├── voucher.ts             # Validation & numbering
│   │   ├── voucher-templates.ts   # Nepal voucher hints (Sales, Purchase, etc.)
│   │   ├── ledger-balance.ts      # Balance & NPR formatting
│   │   ├── trial-balance.ts
│   │   └── profit-loss.ts
│   └── actions/
│       ├── company.ts
│       ├── voucher.ts             # createVoucher → auto-posting
│       ├── ledger.ts
│       └── reports.ts
└── prisma/schema.prisma
```

---

## 3. Posting logic (auto-posting)

Tallyco uses **pure double-entry** — no separate “posting” step. Saving a voucher **is** the post.

### On `createVoucher()` (`src/lib/actions/voucher.ts`)

1. `validateVoucherLines()` — min 2 lines, Dr = Cr (±0.001)
2. Assign FY-based voucher number (`SAL-2082-83-0001` style)
3. `Voucher` + `VoucherLine` rows created in one transaction
4. Optional `BillReference` per line (bill-wise)
5. `revalidatePath()` on vouchers, day-book, bills, trial-balance, profit-loss

### Balance derivation (real-time reports)

Reports do **not** store balances. They compute from:

```
Closing balance = Opening (Dr/Cr) + Σ voucher line Dr − Σ voucher line Cr
```

| Report | Source | Filter |
|--------|--------|--------|
| Trial Balance | `trial-balance.ts` | All ledgers, as-of date |
| Profit & Loss | `profit-loss.ts` | Income/Expense group nature, date range |
| Ledger Statement | `reports.ts` | Single ledger movements |

Each new voucher immediately affects the next report load (path revalidation + fresh server render).

---

## 4. Nepal starter chart (company creation)

On `createCompany()`, a transaction seeds:

### Groups (Tally-style)

Capital, Current Assets/Liabilities, Bank, Cash, Debtors, Creditors, Sales, Purchase, Expenses, Incomes.

### Pre-loaded ledgers (beginner-ready)

| Ledger | Group | Type |
|--------|-------|------|
| Cash | Cash-in-Hand | Dr |
| Bank | Bank Accounts | Dr |
| VAT Payable | Current Liabilities | Cr |
| VAT Recoverable | Current Assets | Dr |
| Sales | Sales Accounts | Cr |
| Purchase | Purchase Accounts | Dr |

Party ledgers (customers/suppliers) are created **during voucher entry** via Alt+C.

---

## 5. Voucher templates (Nepal)

`src/lib/accounting/voucher-templates.ts` provides UI hints per type:

| Type | Typical entry |
|------|----------------|
| **Sales** | Dr Party/Cash, Cr Sales + VAT Payable |
| **Purchase** | Dr Purchase + VAT Recoverable, Cr Party/Bank |
| **Receipt** | Dr Cash/Bank, Cr Party |
| **Payment** | Dr Party/Expense, Cr Cash/Bank |
| **Journal** | Dr/Cr any two ledgers |
| **Contra** | Dr/Cr Cash ↔ Bank |

Templates are **guidance only** — user picks actual ledgers from dropdown or creates inline.

---

## 6. Beginner UI flow

```
Login
  → Company Gateway (user sees own companies; admin sees all)
  → Select company → redirects to /transactions/vouchers/new
  → Voucher Entry (default type: Sales)
      ├── Template hint panel
      ├── Alt+C → create ledger without leaving page
      └── Save → voucher detail
  → Sidebar: Daily Entry first, Chart of Accounts last
  → Reports update on next visit (revalidated after save)
```

### Navigation priority (sidebar)

1. **Daily Entry** — Voucher Entry, List, Day Book
2. **Reports** — Trial Balance, P&L
3. **Chart of Accounts** — Groups, Ledgers, Bills
4. **Overview** — Dashboard

---

## 7. Developer checklist for new features

- [ ] Scope all queries by `companyId` from `requireCompany()`
- [ ] Call `requireCompanyAccess()` when switching companies
- [ ] Return plain objects from server actions (no raw `Decimal`/`Date` to client)
- [ ] `revalidatePath()` report routes after any voucher mutation
- [ ] Use `router.push()` / `router.refresh()` — never `window.location` after server actions
- [ ] New ledgers: unique per `(companyId, name)`

---

## 8. Future enhancements (not yet implemented)

- Party master (Sundry Debtor/Creditor) quick-create with PAN
- Nepali FY label (Bikram Sambat) display
- Multi-user per company (invite collaborators)

## 9. Implemented enhancements

- Balance Sheet report (`/reports/balance-sheet`)
- Voucher edit and delete with bill settlement guards
- Bill-wise Against / On Account references with outstanding tracking
- Nepal VAT 13% auto-split on Sales/Purchase voucher entry
- UI redesign Phases 2–4 (voucher type pills, balance bar, stat cards, sonner toasts)
