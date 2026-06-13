# Tallyco Soft — Complete UI/UX Redesign Plan

> Produced by **tallyco-ui-architect** · Nepal accounting · Tally Prime-inspired · Next.js 16 + Tailwind 4 + shadcn/ui

---

## 1. Executive summary

Tallyco’s current UI is functional but reads as a generic admin template: neutral grayscale, repetitive page headers, grid-based voucher lines without visual hierarchy, and reports that lack accounting gravitas. The redesign shifts to a **voucher-first, Nepal-trustworthy premium SaaS** aesthetic — deep teal primary, warm off-white surfaces, tabular figures for NPR amounts, and motion that confirms actions without slowing bookkeepers.

The goal is **beginner confidence**: a new user selects a company, lands on Voucher Entry, sees a Sales template hint, posts their first transaction, and immediately understands that Trial Balance and P&L update automatically.

---

## 2. Design system

### 2.1 Color palette

Extend `src/app/globals.css` — move from pure neutral to **trust teal + warm neutrals**:

| Token | Light value | Purpose |
|-------|-------------|---------|
| `--primary` | `oklch(0.45 0.12 195)` | Deep teal — CTAs, active nav, links |
| `--primary-foreground` | `oklch(0.99 0 0)` | Text on primary |
| `--background` | `oklch(0.985 0.002 90)` | Warm off-white page bg |
| `--card` | `oklch(1 0 0)` | Card surfaces |
| `--muted` | `oklch(0.96 0.005 90)` | Subtle sections |
| `--border` | `oklch(0.91 0.005 90)` | Softer borders |
| `--success` | `oklch(0.55 0.14 145)` | Balanced Dr/Cr, net profit |
| `--warning` | `oklch(0.75 0.15 75)` | Unsaved changes |
| `--sidebar` | `oklch(0.98 0.008 195)` | Hint of teal in sidebar |
| `--sidebar-primary` | `oklch(0.45 0.12 195)` | Active nav accent |

Add semantic utilities:

```css
:root {
  --success: oklch(0.55 0.14 145);
  --success-foreground: oklch(0.99 0 0);
  --warning: oklch(0.75 0.15 75);
  --amount-positive: var(--foreground);
  --amount-negative: var(--destructive);
}
```

**Voucher type colors** (badge variants, not full backgrounds):

| Type | Color hint |
|------|------------|
| Sales | teal |
| Purchase | amber |
| Receipt | green |
| Payment | blue |
| Journal | slate |
| Contra | purple |

### 2.2 Typography

| Role | Class | Use |
|------|-------|-----|
| Page title | `text-2xl font-semibold tracking-tight` | H1 on every page |
| Section title | `text-sm font-medium uppercase tracking-wide text-muted-foreground` | Sidebar groups, table sections |
| Body | `text-sm` | Default |
| Amount (table) | `text-sm font-medium tabular-nums text-right` | All Dr/Cr/NPR cells |
| Amount (hero) | `text-3xl font-semibold tabular-nums` | Net profit, dashboard stats |
| Label | `text-sm font-medium` | Form labels |
| Hint | `text-xs text-muted-foreground` | Template hints, shortcuts |

Use `tabular-nums` everywhere amounts appear — critical for accounting alignment.

### 2.3 Spacing & radius

| Scale | Value | Use |
|-------|-------|-----|
| xs | 4px | Icon gaps |
| sm | 8px | Inline spacing |
| md | 12px | Form field gaps |
| lg | 16px | Card padding |
| xl | 24px | Page sections |
| 2xl | 32px | Page top margin |

Radius: keep `--radius: 0.625rem`; cards `rounded-xl`, buttons `rounded-lg`, inputs `rounded-lg`.

### 2.4 Elevation

| Level | Shadow | Use |
|-------|--------|-----|
| 0 | none | Tables, flat sections |
| 1 | `shadow-sm` | Cards at rest |
| 2 | `shadow-md` | Cards on hover, dropdowns |
| 3 | `shadow-lg` | Modals |

Modal backdrop: `bg-black/40 backdrop-blur-[2px]`.

### 2.5 Status colors

| State | Visual |
|-------|--------|
| Balanced (Diff = 0) | Green pill: `bg-success/10 text-success` |
| Unbalanced | Red text + pulsing border on totals bar |
| Loading | Button spinner, `disabled:opacity-70` |
| Empty | Muted illustration + single CTA |

---

## 3. Layout & shell

### 3.1 App shell wireframe

```
┌──────────────┬──────────────────────────────────────────────────┐
│  SIDEBAR     │  HEADER                                          │
│  240px       │  Company · FY 2082/83 · [+ Voucher] · User ▾     │
│              ├──────────────────────────────────────────────────┤
│  Daily Entry │  PAGE HEADER (title + description + actions)       │
│  Reports     │  ─────────────────────────────────────────────   │
│  COA         │  CONTENT (max-w-6xl or full for tables)          │
│  Overview    │                                                  │
│              │                                                  │
│  [collapse]  │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

### 3.2 Sidebar (`app-sidebar.tsx`)

**Current issues:** Flat list, no visual weight on Voucher Entry, no collapse, active state is subtle fill only.

**Redesign:**

- Width: `w-60` (240px); collapsible to `w-16` icon-only on `lg+` via toggle
- **Pinned top item:** "Voucher Entry" as full-width primary button (not just nav link)
- Section labels: smaller, uppercase, `text-muted-foreground`
- Active item: `border-l-2 border-primary bg-sidebar-accent` + primary text
- Bottom: subtle "Chart of Accounts" separator from daily work
- Transition: `transition-all duration-200` on width collapse

### 3.3 Header (`app-header.tsx`)

**Current issues:** Sparse — company link + email only; no FY, no quick action.

**Redesign:**

```
[≡]  Tallyco · {Company Name} ▾     FY 2082/83 (Shrawan–Ashwin)     [+ New Voucher]  [avatar] ▾
```

- Company name: dropdown → Switch company, Company settings
- FY badge: computed from `company.fyStartMonth` (Nepal BS optional later)
- **Primary header CTA:** `+ New Voucher` always visible
- User menu: email, role badge (Admin), Logout
- Sticky: `sticky top-0 z-40 border-b bg-background/95 backdrop-blur`

### 3.4 Content area

- Default padding: `p-6 lg:p-8`
- Page max-width: `max-w-6xl mx-auto` for forms; `max-w-full` for wide tables
- Shared `PageHeader` component (see §8)

### 3.5 Empty states

| Context | Message | CTA |
|---------|---------|-----|
| No vouchers | "Post your first voucher to start bookkeeping" | New Voucher |
| No ledgers (edge) | "Starter ledgers are ready — or press Alt+C to add more" | Voucher Entry |
| Trial Balance empty | "No balances yet. Save a voucher to see balances here." | New Voucher |
| P&L empty | "Income and expenses appear after you post vouchers." | Day Book |

Use centered card with icon (Receipt, BookOpen), 2-line copy, single primary button.

---

## 4. Navigation redesign

### Information architecture (current → proposed)

| Priority | Section | Routes | Change |
|----------|---------|--------|--------|
| 1 | **Daily Entry** | `/transactions/vouchers/new` ★ | Pin as sidebar button + header CTA |
| 1 | | `/transactions/vouchers` | Add type filter chips |
| 1 | | `/transactions/day-book` | Group rows by voucher visually |
| 2 | **Reports** | `/reports/trial-balance` | Sticky totals footer |
| 2 | | `/reports/profit-loss` | Summary cards above tables |
| 2 | | `/reports/ledger/[id]` | Breadcrumb from TB |
| 3 | **Chart of Accounts** | `/masters/ledgers`, `/masters/groups` | Merge into tabbed "Accounts" page (optional) |
| 3 | | `/transactions/bills` | Move under Reports or COA |
| 4 | **Overview** | `/dashboard` | Voucher-centric stats, not ledger-first |
| — | Gateway | `/companies` | Card grid with owner badge (admin) |

### Keyboard shortcuts (Tally habit)

| Key | Action |
|-----|--------|
| Alt+C | Create ledger (voucher page) |
| Alt+N | New voucher (global, from app layout) |
| Alt+S | Save voucher (when balanced) |

Display shortcut hints in footer of voucher form: `Alt+C Create ledger · Alt+S Save`.

---

## 5. Page-level UX

### 5.1 Dashboard

**Layout:**
```
[Hero CTA card — New Voucher — full width, teal gradient border]
[Stat: Vouchers posted] [Stat: Ledgers active] [Stat: Net this month — from P&L]
[Recent vouchers table — last 5] [Quick links: TB | P&L | Day Book]
```

**Changes:**
- Remove "Create Ledger" from quick links (ledger is secondary)
- Add "Recent activity" mini table with link to each voucher
- Net profit stat pulls from current FY P&L (server-side)

### 5.2 Voucher Entry (`voucher-form.tsx`) — **highest priority**

**Current issues:** CSS grid lines feel like a spreadsheet; template hint is plain box; totals float at bottom; type selector is native `<select>`.

**Wireframe:**
```
┌─ Voucher Type Picker (6 pills: Sales | Purchase | Receipt | Payment | Journal | Contra) ─┐
├─ Meta row: [Voucher No read-only] [Date] [Narration]              [Alt+C Create Ledger] ─┤
├─ Template hint (collapsible, icon per type) ─────────────────────────────────────────────┤
├─ ENTRY TABLE ────────────────────────────────────────────────────────────────────────────┤
│  Ledger ▾          │  Debit (Dr)  │  Credit (Cr)  │  Bill ▾  │  ✕                       │
│  ─────────────────────────────────────────────────────────────────────────────────────── │
│  [sticky totals bar: Dr Total | Cr Total | Diff — green/red]                             │
├─ [+ Add Line]                                                    [Save Voucher — primary] ┤
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**Key components:**
- `VoucherTypePicker` — horizontal pill buttons with type color
- `VoucherLineTable` — semantic `<table>` not CSS grid (better alignment, sticky header)
- `BalanceBar` — sticky footer inside card showing Dr/Cr/Diff with animated color transition
- Template panel: collapsible with chevron, default open for first-time users

**Beginner affordances:**
- On type change: update template hint + suggest line count (e.g. Sales → 3 lines)
- Ledger dropdown: group `<optgroup>` by ledger group name
- Inline validation: red border on line if only Dr or only Cr filled without counterpart
- Success: navigate to detail with brief toast "Voucher saved — reports updated"

### 5.3 Voucher List

**Changes:**
- Type filter chips above table (All | Sales | Purchase | …)
- Amount column: use `formatAmount()` not `toFixed(2)`
- Row hover + click entire row navigates to detail
- Date column: relative for today ("Today") + absolute

### 5.4 Voucher Detail

**Changes:**
- Print-friendly layout (print button)
- Header card: type badge (colored), date, narration
- Amounts: NPR formatted, tabular-nums
- Post-save banner: "Trial Balance and P&L have been updated" with links

### 5.5 Day Book

**Changes:**
- Visual grouping: voucher blocks with subtle `bg-muted/30` separator between vouchers
- First row of each voucher: bold date + number
- Running balance column (optional Phase 2)
- Empty state CTA

### 5.6 Ledgers & Groups

**Ledgers page:**
- Tabbed with Groups OR keep separate with shared sidebar section
- Search/filter input for ledger name
- Link ledger name → ledger statement report
- Opening balance: NPR formatted
- Info callout: "You can also create ledgers during voucher entry (Alt+C)"

**Groups page:**
- Tree/indented view for hierarchy (future); current flat table with nature badges

### 5.7 Trial Balance

**Changes:**
- Summary cards above table: Total Dr | Total Cr | Difference (should be 0)
- Sticky table header on scroll
- Zebra rows: `even:bg-muted/20`
- Zero-balance ledgers: hide by default with toggle "Show zero balances"
- Print: company name + as-of date in header (already partially supported)

### 5.8 Profit & Loss

**Changes:**
- Top summary: Total Income | Total Expenses | Net Profit (3 stat cards)
- Nepal FY period label: "Period: 2081 Shrawan – 2082 Ashadh" (future BS)
- Net result card: larger, green/red, with trend icon
- Side-by-side income/expense on desktop; stacked tabs on mobile

### 5.9 Ledger Statement

**Changes:**
- Breadcrumb: Reports → Trial Balance → {Ledger Name}
- Running balance column emphasized
- Opening balance row styled differently

### 5.10 Company Gateway & Login

**Login:**
- Split layout: left brand panel (teal gradient, Tallyco logo, "Nepal accounting made simple"), right form card
- Remove generic `bg-muted/30` full-page center
- Show demo credentials hint for dev: `admin@tallyco.local`

**Company Gateway:**
- Company cards: larger, hover lift, owner line for admin
- "Create Company" as outline card in grid (dashed border) — Tally company creation pattern
- Empty state illustration

---

## 6. Component patterns

### 6.1 Forms

- Labels above inputs (current — keep)
- Error: `text-destructive text-sm` below field + shake animation on submit fail
- Loading: spinner inside button, text "Saving…"
- No `<form>` wrap on dialogs — div + button (already fixed)
- Required fields: asterisk on label

### 6.2 Tables (`DataTable` pattern)

Extract `src/components/ui/data-table.tsx`:

```tsx
// Wrapper: rounded-xl border overflow-hidden
// TableHeader: sticky top-0 bg-muted/50 backdrop-blur z-10
// TableRow: hover:bg-muted/40 transition-colors duration-100
// Amount cells: className="text-right tabular-nums font-medium"
```

### 6.3 Modals

- `DialogContent`: add `animate-in fade-in zoom-in-95 duration-200`
- Backdrop: `backdrop-blur-[2px]` (in dialog.tsx portal)
- Focus trap on open
- Close on Escape

### 6.4 Filters

- `ReportDateFilter`: inline card with date inputs + Apply button (primary)
- Presets: "This FY", "This Month", "Today" chips for P&L

### 6.5 Action bars

- Voucher save: right-aligned, disabled until balanced, tooltip when disabled explaining why
- Secondary actions left (Add Line, Create Ledger)

---

## 7. Animation & motion guidelines

| Interaction | Duration | Easing | Implementation |
|-------------|----------|--------|----------------|
| Button hover | 150ms | ease-out | `transition-colors` |
| Card hover | 200ms | ease-out | `hover:shadow-md hover:-translate-y-px transition-all` |
| Modal open | 200ms | ease-out | `animate-in fade-in zoom-in-95` |
| Modal close | 150ms | ease-in | `animate-out fade-out zoom-out-95` |
| Sidebar item | 150ms | ease | `transition-colors border-l-2` |
| Sidebar collapse | 200ms | ease-in-out | width transition |
| Page content | 200ms | ease-out | `animate-in fade-in slide-in-from-bottom-2` on main |
| Balance bar color | 200ms | ease | diff → green/red transition |
| Button loading | — | — | `animate-spin` on icon |
| Table row hover | 100ms | ease | `bg-muted/40` |
| Template collapse | 200ms | ease-in-out | `grid-rows-[0fr]→[1fr]` or Radix Collapsible |
| Toast (save success) | 3000ms | — | slide-in from top-right, auto-dismiss |

**Rules:**
- Cap UI chrome animations at 300ms
- `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }`
- Never animate Dr/Cr numbers while user types
- Save = button loading only, not full-page overlay

---

## 8. Frontend implementation recommendations

### 8.1 New shared components

| Component | Path | Used on |
|-----------|------|---------|
| `PageHeader` | `components/layout/page-header.tsx` | All pages |
| `StatCard` | `components/ui/stat-card.tsx` | Dashboard, P&L, TB |
| `AmountCell` | `components/ui/amount-cell.tsx` | All tables |
| `VoucherTypePicker` | `components/forms/voucher-type-picker.tsx` | Voucher form |
| `BalanceBar` | `components/forms/balance-bar.tsx` | Voucher form |
| `EmptyState` | `components/ui/empty-state.tsx` | Lists, reports |
| `VoucherTypeBadge` | `components/ui/voucher-type-badge.tsx` | Lists, detail, day book |

### 8.2 shadcn components to add

```bash
npx shadcn@latest add tooltip separator skeleton collapsible dropdown-menu avatar sonner
```

- **tooltip** — shortcut hints, disabled save explanation
- **skeleton** — dashboard stats loading
- **collapsible** — template hint panel
- **dropdown-menu** — header user + company menus
- **sonner** — toast on voucher save

### 8.3 `globals.css` additions

```css
@theme inline {
  --color-success: var(--success);
  --font-mono-tabular: var(--font-geist-mono);
}

@layer utilities {
  .tabular-amount {
    @apply tabular-nums text-right font-medium;
  }
  .page-enter {
    @apply animate-in fade-in slide-in-from-bottom-2 duration-200;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 8.4 Tailwind patterns (copy-paste)

```tsx
// PageHeader
<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
  <div className="flex gap-2">{actions}</div>
</div>

// StatCard
<div className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
  <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
</div>

// Primary sidebar CTA
<Link href="/transactions/vouchers/new"
  className="mx-2 mb-3 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
  <PlusCircle className="size-4" /> Voucher Entry
</Link>
```

### 8.5 Accessibility

- All icon buttons: `aria-label`
- Voucher line remove: `aria-label="Remove line"`
- Focus visible on all interactive elements (already via `outline-ring/50`)
- Table headers: `scope="col"`
- Color never sole indicator — pair green/red with "Balanced" / "Difference: X" text

### 8.6 Print styles (extend existing `@media print`)

```css
@media print {
  #report-content { font-size: 11pt; }
  .tabular-amount { font-variant-numeric: tabular-nums; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
}
```

---

## 9. Phased rollout

| Phase | Scope | Files | Effort |
|-------|-------|-------|--------|
| **1** | Design tokens, sidebar, header, PageHeader, StatCard | `globals.css`, `app-sidebar.tsx`, `app-header.tsx`, new layout components | 1–2 days |
| **2** | Voucher entry redesign | `voucher-form.tsx`, new picker/balance bar, sonner toasts | 2–3 days |
| **3** | Tables + reports polish | All report pages, voucher list, day book, AmountCell | 2 days |
| **4** | Motion, empty states, login/gateway split layout | `login/page.tsx`, `company-gateway.tsx`, animations | 1 day |
| **5** (optional) | Collapsible sidebar, keyboard shortcuts global, mobile sheet nav | `app/layout.tsx`, hooks | 1 day |

**Total:** ~6–8 dev days for one frontend developer.

### Phase 1 checklist

- [ ] Update CSS variables (teal primary, warm bg, success token)
- [ ] Sidebar: pinned Voucher Entry button, active border-left, section spacing
- [ ] Header: FY badge, New Voucher CTA, company dropdown shell
- [ ] Extract `PageHeader`, apply to all pages
- [ ] `npm run build` passes

### Phase 2 checklist

- [ ] `VoucherTypePicker` pills replace `<select>`
- [ ] `BalanceBar` sticky with green/red diff
- [ ] Ledger dropdown grouped by `<optgroup>`
- [ ] Collapsible template panel
- [ ] Sonner toast on save + `router.push`

---

## 10. Current audit summary

| Area | Score (1–5) | Top issue |
|------|-------------|-----------|
| Design system | 2 | Generic neutral, no brand |
| Navigation | 3 | Voucher-first IA started, no pinned CTA |
| Voucher entry | 3 | Functional but spreadsheet-like |
| Reports | 3 | Correct data, weak visual hierarchy |
| Forms/modals | 4 | Fixed nested forms; needs motion |
| Empty states | 2 | Text-only, no CTAs |
| Motion | 1 | No transitions |
| Nepal context | 3 | NPR format exists; FY/BS not in UI |
| Accessibility | 3 | Basics ok; tooltips/aria incomplete |

---

*Next step: invoke `tallyco-ui-architect` with "Implement Phase 1" to apply design tokens and shell changes.*
