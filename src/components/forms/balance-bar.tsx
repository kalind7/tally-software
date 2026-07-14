import { cn } from "@/lib/utils";

type BalanceBarProps = {
  totalDr: number;
  totalCr: number;
};

export function BalanceBar({ totalDr, totalCr }: BalanceBarProps) {
  const difference = Math.abs(totalDr - totalCr);
  const balanced = difference <= 0.001;

  return (
    <div
      className={cn(
        "sticky bottom-0 flex flex-wrap items-center justify-end gap-4 border-t bg-muted/60 px-4 py-3 text-sm backdrop-blur transition-colors duration-200",
        balanced ? "border-success/30" : "border-destructive/40"
      )}
    >
      <span>
        Dr Total: <strong className="tabular-nums">{totalDr.toFixed(2)}</strong>
      </span>
      <span>
        Cr Total: <strong className="tabular-nums">{totalCr.toFixed(2)}</strong>
      </span>
      <span
        className={cn(
          "rounded-full px-2.5 py-0.5 font-medium tabular-nums",
          balanced
            ? "bg-success/10 text-success"
            : "bg-destructive/10 text-destructive"
        )}
      >
        {balanced ? "Balanced" : `Difference: ${difference.toFixed(2)}`}
      </span>
    </div>
  );
}
