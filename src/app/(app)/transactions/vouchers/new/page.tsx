import { getLedgerGroups, getLedgers } from "@/lib/actions/ledger";
import { requireCompany } from "@/lib/session";
import { VoucherForm } from "@/components/forms/voucher-form";

export default async function NewVoucherPage() {
  await requireCompany();
  const [ledgers, groups] = await Promise.all([getLedgers(), getLedgerGroups()]);

  // #region agent log
  if (ledgers[0]) {
    fetch("http://127.0.0.1:7425/ingest/6043b083-ac5a-4add-b841-3273d5cc4860", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "32c864",
      },
      body: JSON.stringify({
        sessionId: "32c864",
        runId: "pre-fix",
        hypothesisId: "H1",
        location: "vouchers/new/page.tsx",
        message: "passing ledgers to VoucherForm client component",
        data: {
          ledgerCount: ledgers.length,
          firstLedgerOpeningBalanceCtor:
            ledgers[0].openingBalance?.constructor?.name ?? "none",
          hasGroup: !!ledgers[0].group,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  // #endregion

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Voucher Entry</h1>
        <p className="text-muted-foreground">
          Record debit and credit entries. Totals must balance before saving.
        </p>
      </div>
      <VoucherForm ledgers={ledgers} groups={groups} />
    </div>
  );
}
