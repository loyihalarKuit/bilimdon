"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { MenuIcon, XIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/format";

import { Logo } from "./Logo";

const links = [
  { href: "/courses", label: "Kurslar" },
  { href: "/#kategoriyalar", label: "Kategoriyalar" },
  { href: "/certificates/verify", label: "Sertifikatni tekshirish" },
];

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  // Menyular qaysi sahifada ochilganini eslab qolamiz — sahifa o'zgarsa avtomatik yopiladi
  const [openAt, setOpenAt] = useState<string | null>(null);
  const [menuOpenAt, setMenuOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const menuOpen = menuOpenAt === pathname;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenAt(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (pathname.startsWith("/learn/")) return null; // o'quv rejimida o'z sarlavhasi bor

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const isStaff = user && (user.role === "admin" || user.role === "instructor");

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-slate-100",
                  pathname === l.href ? "text-brand-700" : "text-slate-600",
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {loading ? (
            <div className="h-9 w-40 animate-pulse rounded-lg bg-slate-100" />
          ) : user ? (
            <>
              <Link href="/dashboard" className="btn-ghost">
                Mening kurslarim
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpenAt(menuOpen ? null : pathname)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 hover:ring-2 hover:ring-brand-200"
                  aria-label="Foydalanuvchi menyusi"
                  aria-expanded={menuOpen}
                >
                  {user.full_name.charAt(0).toUpperCase()}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                    <div className="border-b border-slate-100 px-3 pb-2">
                      <p className="truncate text-sm font-semibold">{user.full_name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                    <MenuLink href="/dashboard">Shaxsiy kabinet</MenuLink>
                    <MenuLink href="/dashboard/certificates">Sertifikatlarim</MenuLink>
                    <MenuLink href="/profile">Profil sozlamalari</MenuLink>
                    {isStaff && <MenuLink href="/admin">Boshqaruv paneli</MenuLink>}
                    <button
                      onClick={handleLogout}
                      className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      Chiqish
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Kirish
              </Link>
              <Link href="/register" className="btn-primary">
                Ro&apos;yxatdan o&apos;tish
              </Link>
            </>
          )}
        </div>

        <button className="btn-ghost p-2 md:hidden" onClick={() => setOpenAt(open ? null : pathname)} aria-label="Menyu">
          {open ? <XIcon /> : <MenuIcon />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {links.map((l) => (
              <MenuLink key={l.href} href={l.href}>
                {l.label}
              </MenuLink>
            ))}
            <div className="my-2 border-t border-slate-100" />
            {user ? (
              <>
                <MenuLink href="/dashboard">Shaxsiy kabinet</MenuLink>
                <MenuLink href="/dashboard/certificates">Sertifikatlarim</MenuLink>
                <MenuLink href="/profile">Profil sozlamalari</MenuLink>
                {isStaff && <MenuLink href="/admin">Boshqaruv paneli</MenuLink>}
                <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-left text-sm text-red-600">
                  Chiqish
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" className="btn-secondary">
                  Kirish
                </Link>
                <Link href="/register" className="btn-primary">
                  Ro&apos;yxatdan o&apos;tish
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
      {children}
    </Link>
  );
}
