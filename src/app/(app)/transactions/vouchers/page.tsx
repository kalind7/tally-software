import Link from "next/link";
import { getVouchers } from "@/lib/actions/voucher";
import { requireCompany } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function VouchersPage() {
  await requireCompany();
  const vouchers = await getVouchers("desc");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vouchers</h1>
          <p className="text-muted-foreground">
            Double-entry voucher register, sorted by date (newest first).
          </p>
        </div>
        <Button asChild>
          <Link href="/transactions/vouchers/new">New Voucher</Link>
        </Button>
      </div>

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
            {vouchers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No vouchers yet.
                </TableCell>
              </TableRow>
            ) : (
              vouchers.map((v) => {
                const amount = v.lines
                  .filter((l) => l.entryType === "Dr")
                  .reduce((s, l) => s + Number(l.amount), 0);
                return (
                  <TableRow key={v.id}>
                    <TableCell>
                      {new Date(v.date).toLocaleDateString("en-NP")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{v.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/transactions/vouchers/${v.id}`}
                        className="font-medium hover:underline"
                      >
                        {v.number}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {v.narration || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
