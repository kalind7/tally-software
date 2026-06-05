import Link from "next/link";
import { notFound } from "next/navigation";
import { getVoucher } from "@/lib/actions/voucher";
import { requireCompany } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function VoucherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCompany();
  const { id } = await params;
  const voucher = await getVoucher(id);
  if (!voucher) notFound();

  const totalDr = voucher.lines
    .filter((l) => l.entryType === "Dr")
    .reduce((s, l) => s + Number(l.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{voucher.number}</h1>
          <p className="text-muted-foreground">
            {voucher.type} · {new Date(voucher.date).toLocaleDateString("en-IN")}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/transactions/vouchers">Back to list</Link>
        </Button>
      </div>

      {voucher.narration && (
        <p className="text-sm text-muted-foreground">{voucher.narration}</p>
      )}

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ledger</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              <TableHead>Bill</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {voucher.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>{line.ledger.name}</TableCell>
                <TableCell className="text-right">
                  {line.entryType === "Dr" ? Number(line.amount).toFixed(2) : ""}
                </TableCell>
                <TableCell className="text-right">
                  {line.entryType === "Cr" ? Number(line.amount).toFixed(2) : ""}
                </TableCell>
                <TableCell>
                  {line.billRef ? (
                    <span className="text-sm">
                      {line.billRef.billNo} ·{" "}
                      {new Date(line.billRef.billDate).toLocaleDateString("en-IN")}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">{totalDr.toFixed(2)}</TableCell>
              <TableCell className="text-right">{totalDr.toFixed(2)}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <Badge variant="outline">Balanced voucher</Badge>
    </div>
  );
}
