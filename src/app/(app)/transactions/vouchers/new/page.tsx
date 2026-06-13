import { getLedgerGroups, getLedgers } from "@/lib/actions/ledger";
import { requireCompany } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { VoucherForm } from "@/components/forms/voucher-form";

export default async function NewVoucherPage() {
  await requireCompany();
  const [ledgers, groups] = await Promise.all([getLedgers(), getLedgerGroups()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voucher Entry"
        description="Main entry point — pick a voucher type, select ledgers (or Alt+C to create instantly), balance Dr and Cr, then save. Trial Balance and P&L update automatically."
      />
      <VoucherForm ledgers={ledgers} groups={groups} />
    </div>
  );
}
