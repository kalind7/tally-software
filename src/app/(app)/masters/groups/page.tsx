import { getChartOfAccounts } from "@/lib/actions/ledger";
import { requireCompany } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function GroupsPage() {
  await requireCompany();
  const groups = await getChartOfAccounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Chart of Accounts</h1>
        <p className="text-muted-foreground">
          Tally-style index of ledger groups and ledgers.
        </p>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group</TableHead>
              <TableHead>Nature</TableHead>
              <TableHead>Ledger</TableHead>
              <TableHead className="text-right">Opening Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.flatMap((group) =>
              group.ledgers.length > 0
                ? group.ledgers.map((ledger, idx) => (
                    <TableRow key={ledger.id}>
                      <TableCell>
                        {idx === 0 ? group.name : ""}
                      </TableCell>
                      <TableCell>
                        {idx === 0 ? (
                          <Badge variant="secondary">{group.nature}</Badge>
                        ) : (
                          ""
                        )}
                      </TableCell>
                      <TableCell>{ledger.name}</TableCell>
                      <TableCell className="text-right">
                        {Number(ledger.openingBalance).toFixed(2)}{" "}
                        {ledger.openingType}
                      </TableCell>
                    </TableRow>
                  ))
                : [
                    <TableRow key={group.id}>
                      <TableCell>{group.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{group.nature}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        No ledgers
                      </TableCell>
                      <TableCell />
                    </TableRow>,
                  ]
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
