import type { VoucherType } from "@prisma/client";
import { cn } from "@/lib/utils";

const VOUCHER_TYPES: VoucherType[] = [
  "Sales",
  "Purchase",
  "Receipt",
  "Payment",
  "Journal",
  "Contra",
];

const TYPE_COLORS: Record<VoucherType, string> = {
  Sales: "border-teal-500/50 bg-teal-500/10 text-teal-800",
  Purchase: "border-amber-500/50 bg-amber-500/10 text-amber-900",
  Receipt: "border-green-500/50 bg-green-500/10 text-green-800",
  Payment: "border-blue-500/50 bg-blue-500/10 text-blue-800",
  Journal: "border-slate-500/50 bg-slate-500/10 text-slate-800",
  Contra: "border-purple-500/50 bg-purple-500/10 text-purple-800",
};

type VoucherTypePickerProps = {
  value: VoucherType;
  onChange: (type: VoucherType) => void;
  disabled?: boolean;
};

export function VoucherTypePicker({ value, onChange, disabled }: VoucherTypePickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {VOUCHER_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          disabled={disabled}
          onClick={() => onChange(type)}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors duration-150",
            value === type
              ? TYPE_COLORS[type]
              : "border-border bg-background text-muted-foreground hover:bg-muted/50"
          )}
        >
          {type}
        </button>
      ))}
    </div>
  );
}

export { VOUCHER_TYPES };
