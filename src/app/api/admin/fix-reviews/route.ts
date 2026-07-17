import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function replaceAdventure(text: string | null): string | null {
  if (!text) return text;
  return text
    .replace(/adventure one/gi, "Force One")
    .replace(/adventure/gi, "Force One");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviews = await prisma.review.findMany({
    where: {
      OR: [
        { comment: { contains: "adventure", mode: "insensitive" } },
        { reviewerName: { contains: "adventure", mode: "insensitive" } },
      ],
    },
  });

  if (reviews.length === 0) {
    return NextResponse.json({ message: "Nenhuma avaliação com 'adventure' encontrada.", updated: 0 });
  }

  let updated = 0;
  for (const review of reviews) {
    await prisma.review.update({
      where: { id: review.id },
      data: {
        comment: replaceAdventure(review.comment),
        reviewerName: replaceAdventure(review.reviewerName) ?? review.reviewerName,
      },
    });
    updated++;
  }

  return NextResponse.json({ message: `${updated} avaliação(ões) corrigida(s).`, updated });
}
