import { AppShell } from "@/components/layout/AppShell";
import { AdminGuard } from "@/components/auth/AdminGuard";

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <AppShell>{children}</AppShell>
    </AdminGuard>
  );
}
