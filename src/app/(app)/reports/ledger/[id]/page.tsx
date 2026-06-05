import Link from "next/link";
import { notFound } from "next/navigation";
import { getLedgerStatement } from "@/lib/actions/reports";
import { requireCompany } from "@/lib/session";
import { formatAmount } from "@/lib/accounting/ledger-balance";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function LedgerStatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCompany();
  const { id } = await params;
  const ledger = await getLedgerStatement(id);
  if (!ledger) notFound();

  let running =
    ledger.openingType === "Dr"
      ? Number(ledger.openingBalance)
      : -Number(ledger.openingBalance);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{ledger.name}</h1>
          <p className="text-muted-foreground">
            {ledger.group.name} · Ledger Statement
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/reports/trial-balance">Back to Trial Balance</Link>
        </Button>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Voucher</TableHead>
              <TableHead>Particulars</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={3} className="font-medium">
                Opening Balance
              </TableCell>
              <TableCell className="text-right">
                {ledger.openingType === "Dr"
                  ? formatAmount(Number(ledger.openingBalance))
                  : ""}
              </TableCell>
              <TableCell className="text-right">
                {ledger.openingType === "Cr"
                  ? formatAmount(Number(ledger.openingBalance))
                  : ""}
              </TableCell>
              <TableCell className="text-right">
                {formatAmount(Math.abs(running))}{" "}
                {running >= 0 ? "Dr" : "Cr"}
              </TableCell>
            </TableRow>
            {ledger.voucherLines.map((line) => {
              const dr = line.entryType === "Dr" ? Number(line.amount) : 0;
              const cr = line.entryType === "Cr" ? Number(line.amount) : 0;
              running += dr - cr;
              return (
                <TableRow key={line.id}>
                  <TableCell>
                    {new Date(line.voucher.date).toLocaleDateString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/transactions/vouchers/${line.voucher.id}`}
                      className="hover:underline"
                    >
                      {line.voucher.number}
                    </Link>
                  </TableCell>
                  <TableCell>{line.voucher.narration || line.voucher.type}</TableCell>
                  <TableCell className="text-right">
                    {dr > 0 ? formatAmount(dr) : ""}
                  </TableCell>
                  <TableCell className="text-right">
                    {cr > 0 ? formatAmount(cr) : ""}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(Math.abs(running))}{" "}
                    {running >= 0 ? "Dr" : "Cr"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
