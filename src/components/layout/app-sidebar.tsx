"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Building2,
  FileText,
  LayoutDashboard,
  Layers,
  PlusCircle,
  Receipt,
  Scale,
  TrendingUp,
  Wallet,
} from "lucide-react";

const navSections = [
  {
    title: "Daily Entry",
    items: [
      { href: "/transactions/vouchers", label: "Voucher List", icon: Receipt },
      { href: "/transactions/day-book", label: "Day Book", icon: FileText },
    ],
  },
  {
    title: "Reports",
    items: [
      { href: "/reports/trial-balance", label: "Trial Balance", icon: Scale },
      { href: "/reports/profit-loss", label: "Profit & Loss", icon: TrendingUp },
      { href: "/reports/balance-sheet", label: "Balance Sheet", icon: Wallet },
    ],
  },
  {
    title: "Chart of Accounts",
    items: [
      { href: "/masters/groups", label: "Groups", icon: Layers },
      { href: "/masters/ledgers", label: "Ledgers", icon: BookOpen },
      { href: "/transactions/bills", label: "Bill Index", icon: FileText },
    ],
  },
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const voucherEntryActive =
    pathname === "/transactions/vouchers/new" ||
    pathname.startsWith("/transactions/vouchers/new/");

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <Building2 className="size-5 text-primary" />
        <span className="font-semibold tracking-tight">Tallyco Soft</span>
      </div>

      <div className="p-3 pb-0">
        <Link
          href="/transactions/vouchers/new"
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium shadow-sm transition-all duration-150",
            voucherEntryActive
              ? "bg-primary text-primary-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md"
          )}
        >
          <PlusCircle className="size-4" />
          Voucher Entry
        </Link>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border-l-2 px-2 py-2 text-sm transition-colors duration-150",
                        active
                          ? "border-primary bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "border-transparent hover:border-primary/30 hover:bg-sidebar-accent/60"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
