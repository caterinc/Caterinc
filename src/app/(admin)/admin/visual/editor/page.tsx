import { prisma } from "@/lib/prisma";
import { VisualEditorClient, type PageSection } from "@/components/admin/visual/VisualEditorClient";

function buildDefaultSections(sm: Record<string, unknown>): PageSection[] {
  const vh = (sm.ve_hero || {}) as Record<string, unknown>;
  const vf = (sm.ve_features_bar || {}) as Record<string, unknown>;
  const vct = (sm.ve_cta || {}) as Record<string, unknown>;
  return [
    { id: "hero", type: "hero", label: "Banner Principal", enabled: true, settings: { overlayOpacity: 50, overlayColor: "#000000", buttonText: "Comprar Agora", ...vh } },
    { id: "feats", type: "features-bar", label: "Barra de Benefícios", enabled: true, settings: { bgColor: "#000000", iconColor: "#FFCD11", textColor: "#FFFFFF", ...vf } },
    { id: "cta", type: "cta-banner", label: "Banner CTA", enabled: true, settings: { heading: "Pronto para ir longe?", subtitle: "", bgColor: "#FFCD11", textColor: "#000000", buttonText: "Ver Toda a Coleção", buttonUrl: "/produtos", ...vct } },
  ];
}

export default async function VisualEditorPage() {
  const [banners, menus, settings, categories] = await Promise.all([
    prisma.banner.findMany({ orderBy: { order: "asc" } }),
    prisma.menu.findMany({ include: { items: { orderBy: { order: "asc" } } } }),
    prisma.siteSetting.findMany(),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true, image: true, order: true },
    }),
  ]);

  const sm: Record<string, unknown> = {};
  for (const s of settings) {
    try { sm[s.key] = JSON.parse(s.value); } catch { sm[s.key] = s.value; }
  }

  const headerMenu = menus.find((m) => m.location === "header");
  const footerMenu = menus.find((m) => m.location === "footer");

  const initialPageSections: PageSection[] = Array.isArray(sm.ve_sections)
    ? (sm.ve_sections as PageSection[])
    : buildDefaultSections(sm);

  return (
    <VisualEditorClient
      initialBanners={banners}
      initialHeaderItems={headerMenu?.items || []}
      initialFooterItems={footerMenu?.items || []}
      initialSettings={sm}
      initialCategories={categories}
      initialPageSections={initialPageSections}
    />
  );
}
