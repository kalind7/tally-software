import Link from "next/link";
import { requireCompany } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Receipt, Scale, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const { companyId } = await requireCompany();
  const company = await db.company.findUniqueOrThrow({ where: { id: companyId } });

  const [ledgerCount, voucherCount] = await Promise.all([
    db.ledger.count({ where: { companyId } }),
    db.voucher.count({ where: { companyId } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={company.name}
        description="Start with voucher entry — reports update automatically after each save."
        actions={
          <Button asChild>
            <Link href="/transactions/vouchers/new">
              <PlusCircle className="size-4" />
              New Voucher
            </Link>
          </Button>
        }
      />

      <Card className="border-primary/25 bg-primary/5 shadow-sm transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle>Begin here</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Record Sales, Purchase, Receipt, Payment, or Journal vouchers. Starter
          ledgers (Cash, Bank, VAT, Sales, Purchase) are ready — or press Alt+C
          during entry to create more.
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-sm transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vouchers posted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{voucherCount}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ledgers in use
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{ledgerCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Button variant="outline" className="h-auto py-4" asChild>
          <Link href="/transactions/vouchers" className="flex flex-col items-center gap-2">
            <Receipt className="size-5" />
            Voucher List
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4" asChild>
          <Link href="/reports/trial-balance" className="flex flex-col items-center gap-2">
            <Scale className="size-5" />
            Trial Balance
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4" asChild>
          <Link href="/reports/profit-loss" className="flex flex-col items-center gap-2">
            <TrendingUp className="size-5" />
            Profit &amp; Loss
          </Link>
        </Button>
      </div>
    </div>
  );
}
