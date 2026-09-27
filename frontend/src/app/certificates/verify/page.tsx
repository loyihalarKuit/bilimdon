"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { AwardIcon } from "@/components/ui/Icons";
import { api, ApiError } from "@/lib/api";

export default function VerifyCertificatePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = code.trim().toUpperCase();
    if (!value) return;
    setChecking(true);
    setError("");
    try {
      await api.certificates.verify(value);
      router.push(`/certificates/${value}`);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 404 ? "Bunday raqamli sertifikat topilmadi" : "Tekshirishda xatolik");
      setChecking(false);
    }
  };

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
      <div className="card w-full max-w-lg p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <AwardIcon />
        </span>
        <h1 className="mt-4 text-2xl font-bold">Sertifikatni tekshirish</h1>
        <p className="mt-2 text-sm text-slate-600">
          Ish beruvchilar va tashkilotlar sertifikat haqiqiyligini uning raqami orqali tekshirishlari mumkin.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3 text-left">
          {error && <Alert>{error}</Alert>}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="input text-center font-mono tracking-widest uppercase"
            placeholder="Masalan: 3F9A1C2B7D4E"
            maxLength={32}
          />
          <button disabled={checking} className="btn-primary w-full">
            {checking ? "Tekshirilmoqda..." : "Tekshirish"}
          </button>
        </form>
      </div>
    </div>
  );
}
