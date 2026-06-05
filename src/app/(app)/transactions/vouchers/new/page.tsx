import { getLedgerGroups, getLedgers } from "@/lib/actions/ledger";
import { requireCompany } from "@/lib/session";
import { VoucherForm } from "@/components/forms/voucher-form";

export default async function NewVoucherPage() {
  await requireCompany();
  const [ledgers, groups] = await Promise.all([getLedgers(), getLedgerGroups()]);

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
