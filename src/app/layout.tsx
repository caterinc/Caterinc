import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { Toaster } from "@/components/ui/toaster";
import SessionProvider from "@/components/SessionProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CAT Store — Calçados Robustos e Duráveis",
  description: "Encontre os melhores calçados CAT para trabalho e dia a dia. Botas, tênis e sapatos com qualidade industrial.",
  keywords: ["calçados", "botas", "tênis", "CAT", "Caterpillar", "trabalho"],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-cat-light">
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
