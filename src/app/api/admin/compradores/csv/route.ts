import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRealBuyers, buildMetaAudienceCsv } from "@/lib/buyers";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const buyers = await getRealBuyers();
  const csv = buildMetaAudienceCsv(buyers);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="compradores-meta-${date}.csv"`,
    },
  });
}
