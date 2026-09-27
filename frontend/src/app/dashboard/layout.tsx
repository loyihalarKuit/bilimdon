import { RequireAuth } from "@/components/auth/RequireAuth";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return <RequireAuth>{children}</RequireAuth>;
}
