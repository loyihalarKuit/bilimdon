import { cn } from "@/lib/format";

const styles = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-brand-200 bg-brand-50 text-brand-900",
};

export function Alert({
  type = "error",
  children,
  className,
}: {
  type?: keyof typeof styles;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div role={type === "error" ? "alert" : "status"} className={cn("rounded-lg border px-4 py-3 text-sm", styles[type], className)}>
      {children}
    </div>
  );
}
