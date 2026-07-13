import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    redirect("/conta/login?callbackUrl=/admin");
  }

  return (
    <AdminShell user={session.user as { name?: string; email?: string }}>
      {children}
    </AdminShell>
  );
}
