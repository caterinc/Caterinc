import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeString, sanitizeEmail, verifyOrigin } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!verifyOrigin(req)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 });

  let body: { name?: string; email?: string; cpf?: string; phone?: string; subject?: string; description?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Payload inválido" }, { status: 400 }); }

  const name = sanitizeString(body.name || "", 200);
  const email = sanitizeEmail(body.email || "");
  const subject = sanitizeString(body.subject || "", 200);
  const description = sanitizeString(body.description || "", 4000);
  const cpf = sanitizeString(body.cpf || "", 20) || null;
  const phone = sanitizeString(body.phone || "", 20) || null;

  if (!name || !email || !subject || !description) {
    return NextResponse.json({ error: "Preencha nome, e-mail, assunto e descrição." }, { status: 400 });
  }

  // Best-effort: link to the person's most recent order by email, if any.
  const order = await prisma.order.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });

  await prisma.sacRequest.create({
    data: { name, email, cpf, phone, subject, description, orderNumber: order?.orderNumber || null },
  });

  return NextResponse.json({ ok: true });
}
