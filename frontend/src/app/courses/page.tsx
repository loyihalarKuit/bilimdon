import type { Metadata } from "next";
import Link from "next/link";

import { CourseCard } from "@/components/course/CourseCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchIcon } from "@/components/ui/Icons";
import { serverFetch } from "@/lib/api";
import { cn, levelLabels } from "@/lib/format";
import type { Category, CourseLevel, CourseListItem, Page } from "@/lib/types";

export const metadata: Metadata = { title: "Kurslar" };

const PAGE_SIZE = 12;

export default async function CoursesPage({ searchParams }: PageProps<"/courses">) {
  const sp = await searchParams;
  const get = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : "");
  const search = get("search");
  const category = get("category");
  const level = get("level");
  const page = Math.max(1, Number(get("page")) || 1);

  const query = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
  if (search) query.set("search", search);
  if (category) query.set("category", category);
  if (level) query.set("level", level);

  const [data, categories] = await Promise.all([
    serverFetch<Page<CourseListItem>>(`/courses?${query}`, { items: [], total: 0, page, size: PAGE_SIZE }, 30),
    serverFetch<Category[]>("/categories", []),
  ]);
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  const href = (patch: Record<string, string>) => {
    const next = new URLSearchParams({ search, category, level, ...patch });
    for (const [k, v] of [...next.entries()]) if (!v) next.delete(k);
    const s = next.toString();
    return s ? `/courses?${s}` : "/courses";
  };

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Barcha kurslar</h1>
        <p className="mt-1 text-slate-600">O&apos;zbek tilidagi {data.total} ta kurs topildi</p>
      </div>

      <form action="/courses" className="mb-6 flex flex-col gap-3 sm:flex-row">
        {category && <input type="hidden" name="category" value={category} />}
        {level && <input type="hidden" name="level" value={level} />}
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" width={18} height={18} />
          <input name="search" defaultValue={search} placeholder="Kurs nomi bo'yicha qidirish..." className="input pl-10" />
        </div>
        <button className="btn-primary">Qidirish</button>
      </form>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-6">
          <FilterGroup title="Kategoriya">
            <FilterLink href={href({ category: "", page: "" })} active={!category}>Barchasi</FilterLink>
            {categories.map((c) => (
              <FilterLink key={c.id} href={href({ category: c.slug, page: "" })} active={category === c.slug}>
                {c.name} <span className="text-slate-400">({c.course_count})</span>
              </FilterLink>
            ))}
          </FilterGroup>
          <FilterGroup title="Daraja">
            <FilterLink href={href({ level: "", page: "" })} active={!level}>Barchasi</FilterLink>
            {(Object.keys(levelLabels) as CourseLevel[]).map((l) => (
              <FilterLink key={l} href={href({ level: l, page: "" })} active={level === l}>
                {levelLabels[l]}
              </FilterLink>
            ))}
          </FilterGroup>
        </aside>

        <div>
          {data.items.length === 0 ? (
            <EmptyState
              title="Kurs topilmadi"
              description="Qidiruv so'zini yoki filtrlarni o'zgartirib ko'ring."
              action={<Link href="/courses" className="btn-secondary">Filtrlarni tozalash</Link>}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {data.items.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-10 flex justify-center gap-2" aria-label="Sahifalar">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={href({ page: String(p) })}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium",
                    p === page ? "bg-brand-600 text-white" : "border border-slate-300 bg-white hover:bg-slate-50",
                  )}
                >
                  {p}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">{title}</h3>
      <div className="flex flex-wrap gap-1 lg:flex-col">{children}</div>
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-3 py-2 text-sm transition",
        active ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-700 hover:bg-slate-100",
      )}
    >
      {children}
    </Link>
  );
}
