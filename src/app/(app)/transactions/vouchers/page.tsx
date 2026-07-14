import Link from "next/link";
import { getVouchers } from "@/lib/actions/voucher";
import { requireCompany } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { VoucherTableRow } from "@/components/transactions/voucher-table-row";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Receipt } from "lucide-react";
import type { VoucherType } from "@prisma/client";

const VOUCHER_TYPES: VoucherType[] = [
  "Sales",
  "Purchase",
  "Receipt",
  "Payment",
  "Journal",
  "Contra",
];

export default async function VouchersPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireCompany();
  const { type: typeFilter } = await searchParams;
  const vouchers = await getVouchers("desc");
  const filtered =
    typeFilter && VOUCHER_TYPES.includes(typeFilter as VoucherType)
      ? vouchers.filter((v) => v.type === typeFilter)
      : vouchers;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vouchers"
        description="Double-entry voucher register, sorted by date (newest first)."
        actions={
          <Button asChild>
            <Link href="/transactions/vouchers/new">New Voucher</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 print:hidden">
        <Button variant={!typeFilter ? "default" : "outline"} size="sm" asChild>
          <Link href="/transactions/vouchers">All</Link>
        </Button>
        {VOUCHER_TYPES.map((t) => (
          <Button
            key={t}
            variant={typeFilter === t ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/transactions/vouchers?type=${t}`}>{t}</Link>
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No vouchers yet"
          description="Post your first voucher to start bookkeeping."
          actionLabel="New Voucher"
          actionHref="/transactions/vouchers/new"
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Narration</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => {
                const amount = v.lines
                  .filter((l) => l.entryType === "Dr")
                  .reduce((s, l) => s + Number(l.amount), 0);
                return (
                  <VoucherTableRow
                    key={v.id}
                    id={v.id}
                    date={v.date}
                    type={v.type}
                    number={v.number}
                    narration={v.narration}
                    amount={amount}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
