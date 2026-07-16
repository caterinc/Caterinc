import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "ADMIN") return false;
  return true;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const start = sp.get("start");
  const end = sp.get("end");

  const where = start && end
    ? { date: { gte: new Date(start), lte: new Date(end) } }
    : {};

  const [agg, entries] = await Promise.all([
    prisma.adSpend.aggregate({ _sum: { amount: true }, where }),
    prisma.adSpend.findMany({ where, orderBy: { date: "desc" }, take: 14 }),
  ]);

  return NextResponse.json({
    total: agg._sum.amount || 0,
    entries: entries.map((e) => ({ date: e.date.toISOString(), amount: e.amount })),
  });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  let body: { date?: string; amount?: number };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Payload inválido" }, { status: 400 }); }

  const { date, amount } = body;
  if (!date || typeof amount !== "number" || amount < 0 || !Number.isFinite(amount)) {
    return NextResponse.json({ error: "Data e valor válidos são obrigatórios" }, { status: 400 });
  }

  // Normalize to Brazil midnight for that day, regardless of the server's UTC clock.
  const dayStart = new Date(`${date}T00:00:00-03:00`);
  if (Number.isNaN(dayStart.getTime())) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 });
  }

  const row = await prisma.adSpend.upsert({
    where: { date: dayStart },
    update: { amount },
    create: { date: dayStart, amount },
  });

  return NextResponse.json({ ok: true, date: row.date.toISOString(), amount: row.amount });
}
