import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function PrivacidadePage() {
  const footerMenu = await prisma.menu.findUnique({
    where: { location: "footer" },
    include: { items: true },
  });

  const privacyItem = footerMenu?.items.find(
    (item) => item.url.includes("privacidade") || item.url.includes("privacy")
  );

  redirect(privacyItem?.url ?? "/");
}
