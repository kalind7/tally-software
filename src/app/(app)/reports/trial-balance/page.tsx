import Link from "next/link";
import { getTrialBalanceReport } from "@/lib/actions/reports";
import { requireCompany } from "@/lib/session";
import { formatAmount } from "@/lib/accounting/ledger-balance";
import { PageHeader } from "@/components/layout/page-header";
import { ReportDateFilter } from "@/components/forms/report-date-filter";
import { PrintButton } from "@/components/reports/print-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function TrialBalancePage({
  searchParams,
}: {
  searchParams: Promise<{ asOf?: string }>;
}) {
  await requireCompany();
  const { asOf } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const report = await getTrialBalanceReport(asOf);

  return (
    <div className="space-y-6 print:space-y-4" id="report-content">
      <PageHeader
        title="Trial Balance"
        description="Ledger balances as of selected date. Click a ledger to view statement."
        actions={<PrintButton />}
      />

      <div className="print:hidden">
        <ReportDateFilter
          basePath="/reports/trial-balance"
          fields={[{ name: "asOf", label: "As of Date" }]}
          defaults={{ asOf: asOf || today }}
        />
      </div>

      <div className="rounded-xl border print:border-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ledger</TableHead>
              <TableHead>Group</TableHead>
              <TableHead className="text-right">Debit (Dr)</TableHead>
              <TableHead className="text-right">Credit (Cr)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No balances to display.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {report.rows.map((row) => (
                  <TableRow key={row.ledgerId}>
                    <TableCell>
                      <Link
                        href={`/reports/ledger/${row.ledgerId}`}
                        className="font-medium hover:underline"
                      >
                        {row.ledgerName}
                      </Link>
                    </TableCell>
                    <TableCell>{row.groupName}</TableCell>
                    <TableCell className="text-right">
                      {row.dr > 0 ? formatAmount(row.dr) : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.cr > 0 ? formatAmount(row.cr) : ""}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right">
                    {formatAmount(report.totalDr)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(report.totalCr)}
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
