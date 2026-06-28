import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomUUID } from "crypto";

const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

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
  const filename = `uploads/${randomUUID()}.${ext}`;
  const blob = await put(filename, file, { access: "public" });
  return blob.url;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }

  const validExts = ["jpg", "jpeg", "png", "webp", "gif", "svg"];
  const urls: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";

    if (!validExts.includes(ext)) {
      return NextResponse.json({ error: `Formato invalido: ${ext}` }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Arquivo muito grande (max 10MB)" }, { status: 400 });
    }

    const url = USE_BLOB ? await saveBlob(file, ext) : await saveLocal(file, ext);
    urls.push(url);
  }

  return NextResponse.json({ urls });
}
