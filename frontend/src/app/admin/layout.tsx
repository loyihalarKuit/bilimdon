import type { Metadata } from "next";

import { AdminNav } from "@/components/admin/AdminNav";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const metadata: Metadata = { title: "Boshqaruv paneli" };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <RequireAuth roles={["admin", "instructor"]}>
      <div className="container-page grid gap-8 py-8 lg:grid-cols-[220px_1fr]">
        <AdminNav />
        <div className="min-w-0">{children}</div>
      </div>
    </RequireAuth>
  );
}
