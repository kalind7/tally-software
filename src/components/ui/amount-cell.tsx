import { formatAmount } from "@/lib/accounting/ledger-balance";
import { cn } from "@/lib/utils";

type AmountCellProps = {
  value: number;
  currency?: string;
  className?: string;
  empty?: string;
};

export function AmountCell({
  value,
  currency = "NPR",
  className,
  empty = "",
}: AmountCellProps) {
  if (!value || Math.abs(value) < 0.001) {
    return <span className={cn("tabular-amount", className)}>{empty}</span>;
  }
  return (
    <span className={cn("tabular-amount", className)}>
      {formatAmount(value, currency)}
    </span>
  );
}
