import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Sem o cookie do /gate, /admin não deve nem parecer existir — redireciona
  // pra home antes de revelar que a rota existe. Isso não substitui a
  // checagem de sessão/role abaixo, é só a camada de ofuscação.
  const gateCookie = cookies().get("adm_gk")?.value;
  if (!gateCookie || gateCookie !== process.env.ADMIN_GATE_SECRET) {
    redirect("/");
  }

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
