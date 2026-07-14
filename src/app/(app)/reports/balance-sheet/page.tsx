import Link from "next/link";
import { getBalanceSheetReport } from "@/lib/actions/reports";
import { requireCompany } from "@/lib/session";
import { formatAmount } from "@/lib/accounting/ledger-balance";
import { PageHeader } from "@/components/layout/page-header";
import { ReportDateFilter } from "@/components/forms/report-date-filter";
import { PrintButton } from "@/components/reports/print-button";
import { StatCard } from "@/components/ui/stat-card";
import { AmountCell } from "@/components/ui/amount-cell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function SectionTable({
  title,
  rows,
  total,
}: {
  title: string;
  rows: { ledgerId: string; ledgerName: string; groupName: string; amount: number }[];
  total: number;
}) {
  return (
    <div className="rounded-xl border">
      <h2 className="border-b px-4 py-3 font-semibold">{title}</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ledger</TableHead>
            <TableHead>Group</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No balances
              </TableCell>
            </TableRow>
          ) : (
            <>
              {rows.map((row) => (
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
                    <AmountCell value={row.amount} />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right">
                  <AmountCell value={total} />
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default async function BalanceSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ asOf?: string }>;
}) {
  await requireCompany();
  const { asOf } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const report = await getBalanceSheetReport(asOf);

  const diffOk = Math.abs(report.difference) < 0.02;

  return (
    <div className="space-y-6 print:space-y-4" id="report-content">
      <PageHeader
        title="Balance Sheet"
        description="Assets, liabilities, and equity as of selected date."
        actions={<PrintButton />}
      />

      <div className="print:hidden">
        <ReportDateFilter
          basePath="/reports/balance-sheet"
          fields={[{ name: "asOf", label: "As of Date" }]}
          defaults={{ asOf: asOf || today }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Assets" value={formatAmount(report.totalAssets)} />
        <StatCard
          label="Liabilities + Equity"
          value={formatAmount(report.totalLiabilitiesAndEquity)}
        />
        <StatCard
          label="Difference"
          value={formatAmount(Math.abs(report.difference))}
          valueClassName={diffOk ? "text-success" : "text-destructive"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionTable title="Assets" rows={report.assets} total={report.totalAssets} />
        <SectionTable
          title="Liabilities"
          rows={report.liabilities}
          total={report.totalLiabilities}
        />
      </div>

      <div className="rounded-xl border">
        <h2 className="border-b px-4 py-3 font-semibold">Equity</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ledger</TableHead>
              <TableHead>Group</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.equity.map((row) => (
              <TableRow key={row.ledgerId}>
                <TableCell>{row.ledgerName}</TableCell>
                <TableCell>{row.groupName}</TableCell>
                <TableCell className="text-right">
                  <AmountCell value={row.amount} />
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={2}>Net Profit / (Loss)</TableCell>
              <TableCell className="text-right">
                <AmountCell value={report.netProfit} />
              </TableCell>
            </TableRow>
            <TableRow className="font-semibold">
              <TableCell colSpan={2}>Total Equity</TableCell>
              <TableCell className="text-right">
                <AmountCell value={report.totalEquity} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
