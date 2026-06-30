import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { Toaster } from "@/components/ui/toaster";
import SessionProvider from "@/components/SessionProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export async function generateMetadata(): Promise<Metadata> {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: ["siteTitle", "siteDescription", "favicon"] } },
    });
    const sm = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      title: sm.siteTitle || "CAT Store — Calçados Robustos e Duráveis",
      description: sm.siteDescription || "Encontre os melhores calçados CAT para trabalho e dia a dia.",
      keywords: ["calçados", "botas", "tênis", "CAT", "Caterpillar", "trabalho"],
      icons: sm.favicon ? { icon: sm.favicon } : undefined,
    };
  } catch {
    return {
      title: "CAT Store — Calçados Robustos e Duráveis",
      description: "Encontre os melhores calçados CAT para trabalho e dia a dia.",
      keywords: ["calçados", "botas", "tênis", "CAT", "Caterpillar", "trabalho"],
    };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-cat-light overflow-x-hidden">
        <SessionProvider session={session}>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
