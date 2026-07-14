import Link from "next/link";
import { getBillIndex } from "@/lib/actions/bill";
import { requireCompany } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { SortToggle } from "@/components/forms/sort-toggle";
import { AmountCell } from "@/components/ui/amount-cell";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; open?: string }>;
}) {
  await requireCompany();
  const { sort, open } = await searchParams;
  const sortOrder = sort === "desc" ? "desc" : "asc";
  const openOnly = open === "1";
  const bills = await getBillIndex(sortOrder, openOnly);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bill Index"
        description="Bill-wise entries with outstanding balances."
        actions={
          <div className="flex gap-2">
            <Button variant={openOnly ? "default" : "outline"} size="sm" asChild>
              <Link href={`/transactions/bills?open=1&sort=${sortOrder}`}>
                Open only
              </Link>
            </Button>
            <Button variant={!openOnly ? "default" : "outline"} size="sm" asChild>
              <Link href={`/transactions/bills?sort=${sortOrder}`}>All bills</Link>
            </Button>
            <SortToggle current={sortOrder} basePath="/transactions/bills" />
          </div>
        }
      />

      {bills.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No bills yet"
          description="Add bill-wise details when creating Sales, Purchase, Receipt, or Payment vouchers."
          actionLabel="New Voucher"
          actionHref="/transactions/vouchers/new"
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill Date</TableHead>
                <TableHead>Bill No.</TableHead>
                <TableHead>Party / Ledger</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Voucher</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell>
                    {new Date(bill.billDate).toLocaleDateString("en-NP")}
                  </TableCell>
                  <TableCell className="font-medium">{bill.billNo}</TableCell>
                  <TableCell>{bill.ledger.name}</TableCell>
                  <TableCell className="text-right">
                    <AmountCell value={Number(bill.amount)} />
                  </TableCell>
                  <TableCell className="text-right">
                    {bill.refType === "New" ? (
                      <AmountCell value={bill.outstanding} />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {bill.dueDate
                      ? new Date(bill.dueDate).toLocaleDateString("en-NP")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{bill.refType}</Badge>
                  </TableCell>
                  <TableCell>
                    {bill.voucherLine?.voucher ? (
                      <Link
                        href={`/transactions/vouchers/${bill.voucherLine.voucher.id}`}
                        className="hover:underline"
                      >
                        {bill.voucherLine.voucher.number}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
