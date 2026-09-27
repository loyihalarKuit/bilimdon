"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/format";

export function AdminNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const items = [
    { href: "/admin", label: "Kurslar", match: (p: string) => p === "/admin" || p.startsWith("/admin/courses") },
    ...(user?.role === "admin"
      ? [
          { href: "/admin/categories", label: "Kategoriyalar", match: (p: string) => p.startsWith("/admin/categories") },
          { href: "/admin/users", label: "Foydalanuvchilar", match: (p: string) => p.startsWith("/admin/users") },
        ]
      : []),
  ];
  return (
    <aside>
      <p className="mb-3 px-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">Boshqaruv paneli</p>
      <nav className="flex gap-1 lg:flex-col">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium",
              i.match(pathname) ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-100",
            )}
          >
            {i.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
