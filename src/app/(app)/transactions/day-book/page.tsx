import Link from "next/link";
import { getDayBook } from "@/lib/actions/voucher";
import { requireCompany } from "@/lib/session";
import { SortToggle } from "@/components/forms/sort-toggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Day Book</h1>
          <p className="text-muted-foreground">
            All vouchers sorted by date — toggle sort order as needed.
          </p>
        </div>
        <SortToggle current={sortOrder} basePath="/transactions/day-book" />
      </div>

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
                <TableRow key={`${v.id}-${line.id}`}>
                  <TableCell>
                    {idx === 0
                      ? new Date(v.date).toLocaleDateString("en-NP")
                      : ""}
                  </TableCell>
                  <TableCell>
                    {idx === 0 ? (
                      <Link
                        href={`/transactions/vouchers/${v.id}`}
                        className="hover:underline"
                      >
                        {v.number}
                      </Link>
                    ) : (
                      ""
                    )}
                  </TableCell>
                  <TableCell>
                    {idx === 0 ? (
                      <Badge variant="secondary">{v.type}</Badge>
                    ) : (
                      ""
                    )}
                  </TableCell>
                  <TableCell>{line.ledger.name}</TableCell>
                  <TableCell className="text-right">
                    {line.entryType === "Dr"
                      ? Number(line.amount).toFixed(2)
                      : ""}
                  </TableCell>
                  <TableCell className="text-right">
                    {line.entryType === "Cr"
                      ? Number(line.amount).toFixed(2)
                      : ""}
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
