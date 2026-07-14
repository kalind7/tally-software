import Link from "next/link";
import { notFound } from "next/navigation";
import { getVoucher } from "@/lib/actions/voucher";
import { requireCompany } from "@/lib/session";
import { formatAmount } from "@/lib/accounting/ledger-balance";
import { PageHeader } from "@/components/layout/page-header";
import { VoucherActions } from "@/components/forms/voucher-actions";
import { VoucherTypeBadge } from "@/components/ui/voucher-type-badge";
import { AmountCell } from "@/components/ui/amount-cell";
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
    <div className="space-y-6" id="report-content">
      <PageHeader
        title={voucher.number}
        description={`${new Date(voucher.date).toLocaleDateString("en-NP")}${voucher.narration ? ` · ${voucher.narration}` : ""}`}
        actions={<VoucherActions voucherId={voucher.id} />}
      />

      <div className="flex items-center gap-2">
        <VoucherTypeBadge type={voucher.type} />
        <span className="text-sm text-muted-foreground">
          Trial Balance, P&amp;L, and Balance Sheet update after changes.
        </span>
      </div>

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
                <TableCell>
                  <Link
                    href={`/reports/ledger/${line.ledgerId}`}
                    className="hover:underline"
                  >
                    {line.ledger.name}
                  </Link>
                </TableCell>
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
                <TableCell>
                  {line.billRef ? (
                    <span className="text-sm">
                      {line.billRef.refType}: {line.billRef.billNo}
                      {line.billRef.refType === "New" &&
                        ` · ${new Date(line.billRef.billDate).toLocaleDateString("en-NP")}`}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">
                {formatAmount(totalDr)}
              </TableCell>
              <TableCell className="text-right">
                {formatAmount(totalDr)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
