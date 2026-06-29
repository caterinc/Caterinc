import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Keys that contain secrets and must never be sent to unauthenticated clients
const SECRET_KEYS = new Set(["mp_access_token", "mp_webhook_secret", "utmify_api_key"]);

export async function GET(req: NextRequest) {
  const settings = await prisma.siteSetting.findMany();
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  const result: Record<string, unknown> = {};
  for (const s of settings) {
    // Never expose secret keys to non-admins
    if (SECRET_KEYS.has(s.key) && !isAdmin) continue;

    try {
      result[s.key] = JSON.parse(s.value);
    } catch {
      result[s.key] = s.value;
    }
  }
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const updates = Object.entries(body);

  await Promise.all(
    updates.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { value: typeof value === "string" ? value : JSON.stringify(value) },
        create: { key, value: typeof value === "string" ? value : JSON.stringify(value) },
      })
    )
  );

  return NextResponse.json({ success: true });
}
