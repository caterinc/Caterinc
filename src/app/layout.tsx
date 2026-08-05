import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { Toaster } from "@/components/ui/toaster";
import SessionProvider from "@/components/SessionProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Pinch-zoom disabled site-wide: an accidental pinch mid-swipe (e.g. on the
// product photo gallery) left the page visibly "shrunk" with empty space on
// one side, which looked identical to the page bug reports.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

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
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Block DevTools — stops casual inspection */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){document.addEventListener('contextmenu',function(e){e.preventDefault();});document.addEventListener('keydown',function(e){if(e.key==='F12'){e.preventDefault();return false;}if(e.ctrlKey&&e.shiftKey&&['I','J','C','K'].indexOf(e.key.toUpperCase())!==-1){e.preventDefault();return false;}if(e.ctrlKey&&e.key.toLowerCase()==='u'){e.preventDefault();return false;}});})();` }} />
      </head>
      <body className="min-h-screen bg-cat-light overflow-x-hidden" suppressHydrationWarning>
        <SessionProvider session={session}>
          <CartProvider>
            {children}
            <Toaster />
            <Analytics />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
