import Link from "next/link";
import { getLedgerGroups, getLedgers } from "@/lib/actions/ledger";
import { requireCompany } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { LedgerForm } from "@/components/forms/ledger-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function LedgersPage() {
  await requireCompany();
  const [ledgers, groups] = await Promise.all([getLedgers(), getLedgerGroups()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ledgers"
        description="Chart of accounts with opening and current balances. Updated automatically when vouchers are saved."
        actions={<LedgerForm groups={groups} />}
      />

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Nature</TableHead>
              <TableHead className="text-right">Opening Balance</TableHead>
              <TableHead className="text-right">Current Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledgers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No ledgers yet. Create your first ledger.
                </TableCell>
              </TableRow>
            ) : (
              ledgers.map((ledger) => (
                <TableRow key={ledger.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/reports/ledger/${ledger.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {ledger.name}
                    </Link>
                  </TableCell>
                  <TableCell>{ledger.group.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ledger.group.nature}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-amount">
                    {Number(ledger.openingBalance).toFixed(2)} {ledger.openingType}
                  </TableCell>
                  <TableCell className="text-right tabular-amount">
                    {ledger.currentDr > 0 ? (
                      <span>{ledger.currentDr.toFixed(2)} Dr</span>
                    ) : ledger.currentCr > 0 ? (
                      <span>{ledger.currentCr.toFixed(2)} Cr</span>
                    ) : (
                      <span className="text-muted-foreground">0.00</span>
                    )}
                    {ledger.hasVoucherActivity && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Active
                      </Badge>
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
