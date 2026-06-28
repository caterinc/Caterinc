import { NextResponse } from "next/server";

// Exposes the MP PUBLIC KEY to the client (safe — it's meant to be public)
// NEVER expose MP_ACCESS_TOKEN here
export async function GET() {
  const publicKey = process.env.MP_PUBLIC_KEY || "";
  return NextResponse.json({ publicKey });
}
