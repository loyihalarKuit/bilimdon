"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/format";

const tabs = [
  { href: "/dashboard", label: "Mening kurslarim" },
  { href: "/dashboard/certificates", label: "Sertifikatlar" },
];

export function DashboardHeader() {
  const { user } = useAuth();
  const pathname = usePathname();
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="container-page pt-10">
        <p className="text-sm text-slate-500">Shaxsiy kabinet</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Salom, {user?.full_name.split(" ")[0]}!</h1>
        <nav className="mt-6 flex gap-6">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "border-b-2 pb-3 text-sm font-medium transition",
                pathname === t.href ? "border-brand-600 text-brand-700" : "border-transparent text-slate-600 hover:text-slate-900",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
