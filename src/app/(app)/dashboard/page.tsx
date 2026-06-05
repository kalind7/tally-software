import Link from "next/link";
import { requireCompany } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Receipt, Scale, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const { companyId } = await requireCompany();
  const company = await db.company.findUniqueOrThrow({ where: { id: companyId } });

  const [ledgerCount, voucherCount, billCount] = await Promise.all([
    db.ledger.count({ where: { companyId } }),
    db.voucher.count({ where: { companyId } }),
    db.billReference.count({ where: { companyId } }),
  ]);

  const quickLinks = [
    { href: "/masters/ledgers", label: "Create Ledger", icon: BookOpen },
    { href: "/transactions/vouchers/new", label: "New Voucher", icon: Receipt },
    { href: "/reports/trial-balance", label: "Trial Balance", icon: Scale },
    { href: "/reports/profit-loss", label: "Profit & Loss", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{company.name}</h1>
        <p className="text-muted-foreground">Accounting dashboard</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ledgers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{ledgerCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vouchers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{voucherCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{billCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Button key={link.href} variant="outline" className="h-auto py-4" asChild>
              <Link href={link.href} className="flex flex-col items-center gap-2">
                <Icon className="size-5" />
                {link.label}
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
