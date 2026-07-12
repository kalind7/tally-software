import type { VoucherType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const TYPE_VARIANTS: Record<VoucherType, string> = {
  Sales: "border-teal-500/40 bg-teal-500/10 text-teal-800",
  Purchase: "border-amber-500/40 bg-amber-500/10 text-amber-900",
  Receipt: "border-green-500/40 bg-green-500/10 text-green-800",
  Payment: "border-blue-500/40 bg-blue-500/10 text-blue-800",
  Journal: "border-slate-500/40 bg-slate-500/10 text-slate-800",
  Contra: "border-purple-500/40 bg-purple-500/10 text-purple-800",
};

export function VoucherTypeBadge({
  type,
  className,
}: {
  type: VoucherType;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(TYPE_VARIANTS[type], className)}>
      {type}
    </Badge>
  );
}
