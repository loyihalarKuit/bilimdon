import { cn } from "@/lib/format";

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-200", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-accent-500" : "bg-brand-600")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
