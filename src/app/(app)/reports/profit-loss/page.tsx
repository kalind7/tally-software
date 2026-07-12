import Link from "next/link";
import { getProfitLossReport } from "@/lib/actions/reports";
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

function getDefaultPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const fyStart = month >= 3 ? year : year - 1;
  const from = `${fyStart}-04-01`;
  const to = now.toISOString().slice(0, 10);
  return { from, to };
}

export default async function ProfitLossPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireCompany();
  const params = await searchParams;
  const defaults = getDefaultPeriod();
  const from = params.from || defaults.from;
  const to = params.to || defaults.to;
  const report = await getProfitLossReport(from, to);

  return (
    <div className="space-y-6" id="report-content">
      <PageHeader
        title="Profit & Loss Account"
        description="Income and expenses for the selected period."
        actions={<PrintButton />}
      />

      <div className="print:hidden">
        <ReportDateFilter
          basePath="/reports/profit-loss"
          fields={[
            { name: "from", label: "From Date" },
            { name: "to", label: "To Date" },
          ]}
          defaults={{ from, to }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Income" value={formatAmount(report.totalIncome)} />
        <StatCard label="Total Expenses" value={formatAmount(report.totalExpenses)} />
        <StatCard
          label={report.netProfit >= 0 ? "Net Profit" : "Net Loss"}
          value={formatAmount(Math.abs(report.netProfit))}
          valueClassName={
            report.netProfit >= 0 ? "text-success" : "text-destructive"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border">
          <h2 className="border-b px-4 py-3 font-semibold">Income</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ledger</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.income.map((row) => (
                <TableRow key={row.ledgerId}>
                  <TableCell>
                    <Link
                      href={`/reports/ledger/${row.ledgerId}`}
                      className="hover:underline"
                    >
                      {row.ledgerName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <AmountCell value={row.amount} />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold">
                <TableCell>Total Income</TableCell>
                <TableCell className="text-right">
                  <AmountCell value={report.totalIncome} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="rounded-xl border">
          <h2 className="border-b px-4 py-3 font-semibold">Expenses</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ledger</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.expenses.map((row) => (
                <TableRow key={row.ledgerId}>
                  <TableCell>
                    <Link
                      href={`/reports/ledger/${row.ledgerId}`}
                      className="hover:underline"
                    >
                      {row.ledgerName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <AmountCell value={row.amount} />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold">
                <TableCell>Total Expenses</TableCell>
                <TableCell className="text-right">
                  <AmountCell value={report.totalExpenses} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
