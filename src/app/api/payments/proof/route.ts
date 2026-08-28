import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const VALID_EXTS = ["jpg", "jpeg", "png", "webp", "pdf"];
const MAX_SIZE = 10 * 1024 * 1024;

async function saveLocal(file: File, ext: string): Promise<string> {
  const { writeFile, mkdir } = await import("fs/promises");
  const { join } = await import("path");
  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  const bytes = await file.arrayBuffer();
  await writeFile(join(uploadDir, filename), Buffer.from(bytes));
  return `/uploads/${filename}`;
}

async function saveBlob(file: File, ext: string): Promise<string> {
  const { put } = await import("@vercel/blob");
  const filename = `comprovantes/${randomUUID()}.${ext}`;
  const blob = await put(filename, file, { access: "public" });
  return blob.url;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const orderId = formData.get("orderId");
  const file = formData.get("file");

  if (typeof orderId !== "string" || !orderId) {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!VALID_EXTS.includes(ext)) {
    return NextResponse.json({ error: "Formato inválido. Envie uma imagem ou PDF." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo muito grande (máx 10MB)" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ error: "Esse pedido já está confirmado como pago." }, { status: 409 });
  }

  const url = USE_BLOB ? await saveBlob(file, ext) : await saveLocal(file, ext);

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentProofUrl: url, paymentProofAt: new Date() },
  });
  await prisma.orderStatusHistory.create({
    data: { orderId: order.id, status: order.status, note: "Comprovante de pagamento anexado pelo cliente" },
  });

  return NextResponse.json({ success: true, url });
}
