import { CategoryIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/format";

const gradients = [
  "from-brand-500 to-indigo-700",
  "from-emerald-500 to-teal-700",
  "from-orange-400 to-rose-600",
  "from-violet-500 to-fuchsia-700",
  "from-sky-500 to-blue-700",
  "from-amber-400 to-orange-600",
];

/** Kurs rasmi; rasm yo'q bo'lsa kategoriya ikonali chiroyli gradient ko'rsatiladi. */
export function CourseThumb({
  id,
  title,
  url,
  icon,
  className,
}: {
  id: number;
  title: string;
  url: string | null;
  icon?: string | null;
  className?: string;
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- ixtiyoriy tashqi domenlar uchun
    return <img src={url} alt={title} className={cn("aspect-video w-full object-cover", className)} />;
  }
  return (
    <div
      className={cn(
        "relative flex aspect-video w-full items-center justify-center overflow-hidden bg-gradient-to-br",
        gradients[id % gradients.length],
        className,
      )}
    >
      <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -top-8 -left-8 h-24 w-24 rounded-full bg-white/10" />
      <CategoryIcon icon={icon} width={48} height={48} className="text-white/90" strokeWidth={1.5} />
    </div>
  );
}
