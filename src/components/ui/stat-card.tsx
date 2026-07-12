import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
};

export function StatCard({ label, value, className, valueClassName }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 text-3xl font-semibold tabular-nums", valueClassName)}>
        {value}
      </p>
    </div>
  );
}
