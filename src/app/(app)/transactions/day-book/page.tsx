import Link from "next/link";
import { getDayBook } from "@/lib/actions/voucher";
import { requireCompany } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { SortToggle } from "@/components/forms/sort-toggle";
import { AmountCell } from "@/components/ui/amount-cell";
import { VoucherTypeBadge } from "@/components/ui/voucher-type-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function DayBookPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  await requireCompany();
  const { sort } = await searchParams;
  const sortOrder = sort === "asc" ? "asc" : "desc";
  const vouchers = await getDayBook(sortOrder);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Day Book"
        description="All vouchers sorted by date — grouped by voucher."
        actions={
          <SortToggle current={sortOrder} basePath="/transactions/day-book" />
        }
      />

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Voucher</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Particulars</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vouchers.flatMap((v) =>
              v.lines.map((line, idx) => (
                <TableRow
                  key={`${v.id}-${line.id}`}
                  className={idx === 0 ? "bg-muted/30" : undefined}
                >
                  <TableCell>
                    {idx === 0
                      ? new Date(v.date).toLocaleDateString("en-NP")
                      : ""}
                  </TableCell>
                  <TableCell>
                    {idx === 0 ? (
                      <Link
                        href={`/transactions/vouchers/${v.id}`}
                        className="font-medium hover:underline"
                      >
                        {v.number}
                      </Link>
                    ) : (
                      ""
                    )}
                  </TableCell>
                  <TableCell>
                    {idx === 0 ? <VoucherTypeBadge type={v.type} /> : ""}
                  </TableCell>
                  <TableCell>{line.ledger.name}</TableCell>
                  <TableCell className="text-right">
                    {line.entryType === "Dr" ? (
                      <AmountCell value={Number(line.amount)} />
                    ) : (
                      ""
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {line.entryType === "Cr" ? (
                      <AmountCell value={Number(line.amount)} />
                    ) : (
                      ""
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
            {vouchers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No transactions in day book.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
