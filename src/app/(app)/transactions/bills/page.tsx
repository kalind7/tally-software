import Link from "next/link";
import { getBillIndex } from "@/lib/actions/bill";
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

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  await requireCompany();
  const { sort } = await searchParams;
  const sortOrder = sort === "desc" ? "desc" : "asc";
  const bills = await getBillIndex(sortOrder);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bill Index</h1>
          <p className="text-muted-foreground">
            Bill-wise entries auto-sorted by bill date (chronological index).
          </p>
        </div>
        <SortToggle
          current={sortOrder}
          basePath="/transactions/bills"
        />
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill Date</TableHead>
              <TableHead>Bill No.</TableHead>
              <TableHead>Party / Ledger</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Voucher</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No bill-wise entries yet. Add bill details when creating vouchers.
                </TableCell>
              </TableRow>
            ) : (
              bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell>
                    {new Date(bill.billDate).toLocaleDateString("en-NP")}
                  </TableCell>
                  <TableCell className="font-medium">{bill.billNo}</TableCell>
                  <TableCell>{bill.ledger.name}</TableCell>
                  <TableCell className="text-right">
                    {Number(bill.amount).toFixed(2)}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
