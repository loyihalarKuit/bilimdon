"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { AwardIcon } from "@/components/ui/Icons";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Certificate } from "@/lib/types";

export default function MyCertificatesPage() {
  const [items, setItems] = useState<Certificate[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.me
      .certificates()
      .then(setItems)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"));
  }, []);

  return (
    <>
      <DashboardHeader />
      <div className="container-page py-8">
        {error && <Alert>{error}</Alert>}
        {!items ? (
          !error && <PageLoader />
        ) : items.length === 0 ? (
          <EmptyState
            title="Hozircha sertifikat yo'q"
            description="Kursning barcha darslarini tugatib, testlardan o'tsangiz, sertifikat avtomatik beriladi."
            action={<Link href="/dashboard" className="btn-primary">Kurslarimga o&apos;tish</Link>}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((c) => (
              <div key={c.code} className="card overflow-hidden">
                <div className="flex items-center gap-4 bg-gradient-to-r from-brand-700 to-indigo-700 p-5 text-white">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
                    <AwardIcon />
                  </span>
                  <div>
                    <p className="text-xs text-brand-100">Sertifikat</p>
                    <p className="font-mono text-sm tracking-wider">{c.code}</p>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold">{c.course_title}</h3>
                  <p className="mt-1 text-sm text-slate-500">Berilgan sana: {formatDate(c.issued_at)}</p>
                  <Link href={`/certificates/${c.code}`} className="btn-secondary mt-4 w-full">
                    Ko&apos;rish va yuklab olish
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
