"use client";

import { useRouter } from "next/navigation";
import { AmountCell } from "@/components/ui/amount-cell";
import { VoucherTypeBadge } from "@/components/ui/voucher-type-badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { VoucherType } from "@prisma/client";

type VoucherTableRowProps = {
  id: string;
  date: Date;
  type: VoucherType;
  number: string;
  narration: string | null;
  amount: number;
};

export function VoucherTableRow({
  id,
  date,
  type,
  number,
  narration,
  amount,
}: VoucherTableRowProps) {
  const router = useRouter();
  const href = `/transactions/vouchers/${id}`;

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/40"
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(href);
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={`View voucher ${number}`}
    >
      <TableCell>{new Date(date).toLocaleDateString("en-NP")}</TableCell>
      <TableCell>
        <VoucherTypeBadge type={type} />
      </TableCell>
      <TableCell className="font-medium">{number}</TableCell>
      <TableCell className="max-w-xs truncate">{narration || "—"}</TableCell>
      <TableCell className="text-right">
        <AmountCell value={amount} />
      </TableCell>
    </TableRow>
  );
}
