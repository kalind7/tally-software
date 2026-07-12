import { notFound } from "next/navigation";
import { getVoucher } from "@/lib/actions/voucher";
import { getLedgerGroups, getLedgers } from "@/lib/actions/ledger";
import { requireCompany } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { VoucherForm } from "@/components/forms/voucher-form";

export default async function EditVoucherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCompany();
  const { id } = await params;
  const [voucher, ledgers, groups] = await Promise.all([
    getVoucher(id),
    getLedgers(),
    getLedgerGroups(),
  ]);

  if (!voucher) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${voucher.number}`}
        description="Update voucher lines — reports will refresh after save."
      />
      <VoucherForm
        mode="edit"
        voucherId={voucher.id}
        ledgers={ledgers}
        groups={groups}
        initial={{
          type: voucher.type,
          date: voucher.date.toISOString(),
          number: voucher.number,
          narration: voucher.narration,
          lines: voucher.lines.map((line) => ({
            ledgerId: line.ledgerId,
            amount: Number(line.amount),
            entryType: line.entryType,
            billRef: line.billRef
              ? {
                  refType: line.billRef.refType,
                  billNo: line.billRef.billNo,
                  billDate: line.billRef.billDate,
                  dueDate: line.billRef.dueDate,
                  againstBillId: line.billRef.againstBillId,
                }
              : null,
          })),
        }}
      />
    </div>
  );
}
