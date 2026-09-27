"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Spinner } from "@/components/ui/Spinner";
import type { UserRole } from "@/lib/types";

import { useAuth } from "./AuthProvider";

export function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: UserRole[] }) {
  const { user, loading, loggedOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowed = !!user && (!roles || roles.includes(user.role));

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(loggedOut ? "/" : `/login?next=${encodeURIComponent(pathname)}`);
    else if (!allowed) router.replace("/dashboard");
  }, [loading, user, loggedOut, allowed, router, pathname]);

  if (!allowed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }
  return <>{children}</>;
}
