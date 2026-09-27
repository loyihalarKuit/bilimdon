"use client";

import { useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Alert } from "@/components/ui/Alert";
import { api, ApiError } from "@/lib/api";
import { roleLabels } from "@/lib/format";

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

function ProfileContent() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.full_name ?? "");
  const [nameMsg, setNameMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pw, setPw] = useState({ current_password: "", new_password: "" });
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!user) return null;

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUser(await api.users.updateMe({ full_name: name }));
      setNameMsg({ type: "success", text: "Ma'lumotlar saqlandi" });
    } catch (err) {
      setNameMsg({ type: "error", text: err instanceof ApiError ? err.message : "Xatolik" });
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.users.changePassword(pw);
      setPw({ current_password: "", new_password: "" });
      setPwMsg({ type: "success", text: "Parol muvaffaqiyatli yangilandi" });
    } catch (err) {
      setPwMsg({ type: "error", text: err instanceof ApiError ? err.message : "Xatolik" });
    }
  };

  return (
    <div className="container-page max-w-2xl py-10">
      <h1 className="text-3xl font-bold">Profil sozlamalari</h1>

      <form onSubmit={saveName} className="card mt-8 space-y-5 p-6">
        <h2 className="font-semibold">Shaxsiy ma&apos;lumotlar</h2>
        {nameMsg && <Alert type={nameMsg.type}>{nameMsg.text}</Alert>}
        <div>
          <label className="label" htmlFor="name">Ism va familiya</label>
          <input id="name" className="input" value={name} minLength={2} required onChange={(e) => setName(e.target.value)} />
          <p className="mt-1 text-xs text-slate-500">Sertifikatlarda aynan shu ism ko&apos;rsatiladi.</p>
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input bg-slate-50" value={user.email} disabled />
        </div>
        <div>
          <label className="label">Rol</label>
          <input className="input bg-slate-50" value={roleLabels[user.role]} disabled />
        </div>
        <button className="btn-primary">Saqlash</button>
      </form>

      <form onSubmit={savePassword} className="card mt-6 space-y-5 p-6">
        <h2 className="font-semibold">Parolni o&apos;zgartirish</h2>
        {pwMsg && <Alert type={pwMsg.type}>{pwMsg.text}</Alert>}
        <div>
          <label className="label" htmlFor="cur">Joriy parol</label>
          <input id="cur" type="password" className="input" required autoComplete="current-password"
            value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="new">Yangi parol</label>
          <input id="new" type="password" className="input" required minLength={8} autoComplete="new-password"
            value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} />
        </div>
        <button className="btn-primary">Parolni yangilash</button>
      </form>
    </div>
  );
}
