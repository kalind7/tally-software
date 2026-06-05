import { getLedgerGroups, getLedgers } from "@/lib/actions/ledger";
import { requireCompany } from "@/lib/session";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Ledgers</h1>
          <p className="text-muted-foreground">
            Create and manage ledger accounts. Press Alt+C during voucher entry to
            create inline.
          </p>
        </div>
        <LedgerForm groups={groups} />
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Nature</TableHead>
              <TableHead className="text-right">Opening Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledgers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No ledgers yet. Create your first ledger.
                </TableCell>
              </TableRow>
            ) : (
              ledgers.map((ledger) => (
                <TableRow key={ledger.id}>
                  <TableCell className="font-medium">{ledger.name}</TableCell>
                  <TableCell>{ledger.group.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ledger.group.nature}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(ledger.openingBalance).toFixed(2)} {ledger.openingType}
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
