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
  Receipt,
  Scale,
  TrendingUp,
} from "lucide-react";

const navSections = [
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Masters",
    items: [
      { href: "/masters/groups", label: "Groups", icon: Layers },
      { href: "/masters/ledgers", label: "Ledgers", icon: BookOpen },
    ],
  },
  {
    title: "Transactions",
    items: [
      { href: "/transactions/vouchers", label: "Vouchers", icon: Receipt },
      { href: "/transactions/day-book", label: "Day Book", icon: FileText },
      { href: "/transactions/bills", label: "Bill Index", icon: FileText },
    ],
  },
  {
    title: "Reports",
    items: [
      { href: "/reports/trial-balance", label: "Trial Balance", icon: Scale },
      { href: "/reports/profit-loss", label: "Profit & Loss", icon: TrendingUp },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Building2 className="size-5" />
        <span className="font-semibold">Tallyco Soft</span>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
                        "flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "hover:bg-sidebar-accent/60"
                      )}
                    >
                      <Icon className="size-4" />
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
