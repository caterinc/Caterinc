import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Avaliações enviadas por clientes nunca ficam visíveis automaticamente —
// apenas as avaliações que o admin importa/cadastra aparecem na loja.
export async function POST(req: NextRequest) {
  let body: { productId?: string; reviewerName?: string; rating?: number; comment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const { productId, reviewerName, rating, comment } = body;
  if (!productId || !reviewerName?.trim() || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    await prisma.review.create({
      data: {
        productId,
        reviewerName: reviewerName.trim().slice(0, 100),
        rating,
        comment: comment?.trim().slice(0, 1000) || null,
        verifiedPurchase: false,
        isVisible: false,
      },
    });
  } catch {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
