import { getChartOfAccounts } from "@/lib/actions/ledger";
import { requireCompany } from "@/lib/session";
import { ChartOfAccountsTable } from "@/components/masters/chart-of-accounts-table";

export default async function GroupsPage() {
  await requireCompany();
  const groups = await getChartOfAccounts();

  const rows = groups.map((group) => ({
    id: group.id,
    name: group.name,
    nature: group.nature,
    ledgers: group.ledgers.map((ledger) => ({
      id: ledger.id,
      name: ledger.name,
      openingBalance: Number(ledger.openingBalance),
      openingType: ledger.openingType,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Chart of Accounts</h1>
        <p className="text-muted-foreground">
          Tally-style index of ledger groups and ledgers.
        </p>
      </div>

      <ChartOfAccountsTable groups={rows} />
    </div>
  );
}
